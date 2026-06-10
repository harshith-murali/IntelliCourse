import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ImagePlus, Upload, Save, Plus } from 'lucide-react';
import api from '../api/axios';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import './CourseEditor.css';

const initialForm = {
  title: '',
  subtitle: '',
  description: '',
  category: '',
  level: 'beginner',
  price: 0,
  isPublished: true
};

const getId = (value) => value?._id || value?.id || value || '';

const CourseEditor = () => {
  const { courseId } = useParams();
  const isEditing = Boolean(courseId);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [course, setCourse] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [lectureForm, setLectureForm] = useState({
    title: '',
    description: '',
    sectionTitle: '',
    order: '',
    duration: '',
    tags: '',
    difficulty: 'beginner',
    transcript: '',
    notes: '',
    objectives: '',
    resources: '',
    isPreview: false
  });
  const [videoFile, setVideoFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({ thumbnail: 0, video: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [error, setError] = useState('');
  const [forbidden, setForbidden] = useState(false);
  const currentUserId = getId(user);

  useEffect(() => {
    const loadCourse = async () => {
      if (!isEditing) return;
      try {
        const { data } = await api.get(`/course/c/${courseId}`);
        const loaded = data.data;
        if (getId(loaded?.instructor) !== currentUserId) {
          setForbidden(true);
          setError('Only the creator of this course can edit courses, upload media, or delete it.');
          return;
        }
        setCourse(loaded);
        setForm({
          title: loaded.title || '',
          subtitle: loaded.subtitle || '',
          description: loaded.description || '',
          category: loaded.category || '',
          level: loaded.level || 'beginner',
          price: loaded.price || 0,
          isPublished: Boolean(loaded.isPublished)
        });
        setThumbnailPreview(loaded.thumbnailUrl || loaded.thumbnail || '');
      } catch (err) {
        const message = err.response?.data?.message || 'Unable to load course.';
        setError(message);
        setForbidden(err.response?.status === 403);
      }
    };
    loadCourse();
  }, [courseId, currentUserId, isEditing]);

  const validateThumbnail = (file) => {
    if (!file) return true;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Thumbnail must be a JPEG, PNG, or WEBP image.');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Thumbnail must be smaller than 5MB.');
      return false;
    }
    return true;
  };

  const validateVideo = (file) => {
    if (!file) return false;
    if (!['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type)) {
      setError('Lecture video must be MP4, WEBM, or MOV.');
      return false;
    }
    if (file.size > 1024 * 1024 * 1024) {
      setError('Lecture video must be smaller than 1GB.');
      return false;
    }
    return true;
  };

  const handleThumbnailSelect = (file) => {
    setError('');
    if (!validateThumbnail(file)) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const uploadThumbnail = async (targetCourseId) => {
    if (!thumbnailFile) return {};
    const { data } = await api.post('/media/presigned-thumbnail', {
      courseId: targetCourseId,
      fileName: thumbnailFile.name,
      fileType: thumbnailFile.type,
      fileSize: thumbnailFile.size
    });
    await api.put(data.data.uploadUrl, thumbnailFile, {
      headers: { 'Content-Type': thumbnailFile.type },
      withCredentials: false,
      onUploadProgress: (event) => {
        const percent = Math.round((event.loaded * 100) / (event.total || thumbnailFile.size));
        setUploadProgress(prev => ({ ...prev, thumbnail: percent }));
      }
    });
    return { thumbnailUrl: data.data.rawUrl, thumbnailKey: data.data.s3Key };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim() || !form.category.trim()) {
      setError('Title and category are required.');
      return;
    }
    if (Number(form.price) < 0) {
      setError('Price cannot be negative.');
      return;
    }
    if (!validateThumbnail(thumbnailFile)) return;

    setSubmitting(true);
    try {
      let savedCourse = course;
      if (isEditing) {
        const { data } = await api.patch(`/course/c/${courseId}`, form);
        savedCourse = data.data;
      } else {
        const { data } = await api.post('/course', form);
        savedCourse = data.data;
      }

      const thumbnailData = await uploadThumbnail(savedCourse._id);
      if (thumbnailData.thumbnailUrl) {
        const { data } = await api.patch(`/course/c/${savedCourse._id}`, thumbnailData);
        savedCourse = data.data;
      }
      setCourse(savedCourse);
      navigate(`/instructor/courses/${savedCourse._id}/edit`);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save course.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddLecture = async (e) => {
    e.preventDefault();
    setError('');
    if (!course?._id) {
      setError('Save the course before adding lectures.');
      return;
    }
    const title = lectureForm.title.trim();
    const description = lectureForm.description.trim();
    const sectionTitle = lectureForm.sectionTitle.trim();
    const order = Number(lectureForm.order || (course.lectures?.length || 0) + 1);
    const duration = Number(lectureForm.duration || 0);
    const tags = lectureForm.tags.split(',').map(tag => tag.trim()).filter(Boolean);
    const objectives = lectureForm.objectives.split('\n').map(item => item.trim()).filter(Boolean);
    const resources = lectureForm.resources
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(url => ({ url }));

    if (!title || !description || !sectionTitle) {
      setError('Lecture title, description, and section/module title are required.');
      return;
    }
    if (!Number.isFinite(order) || order <= 0) {
      setError('Lesson order must be a positive number.');
      return;
    }
    if (!Number.isFinite(duration) || duration < 0) {
      setError('Duration must be zero or greater.');
      return;
    }
    if (!tags.length) {
      setError('Add at least one tag or keyword.');
      return;
    }
    if (!validateVideo(videoFile)) return;

    setUploadingVideo(true);
    try {
      const lectureRes = await api.post(`/course/c/${course._id}/lectures`, {
        title,
        description,
        sectionTitle,
        order,
        duration,
        tags,
        difficulty: lectureForm.difficulty,
        transcript: lectureForm.transcript.trim(),
        notes: lectureForm.notes.trim(),
        objectives,
        resources,
        isPreview: lectureForm.isPreview,
      });
      const lecture = lectureRes.data.data;
      const uploadRes = await api.post('/media/presigned-upload', {
        courseId: course._id,
        fileName: videoFile.name,
        fileType: videoFile.type,
        fileSize: videoFile.size
      });
      await api.put(uploadRes.data.data.uploadUrl, videoFile, {
        headers: { 'Content-Type': videoFile.type },
        withCredentials: false,
        onUploadProgress: (event) => {
          const percent = Math.round((event.loaded * 100) / (event.total || videoFile.size));
          setUploadProgress(prev => ({ ...prev, video: percent }));
        }
      });
      await api.post('/media/confirm-upload', {
        mediaAssetId: uploadRes.data.data.mediaAssetId,
        lectureId: lecture._id,
        duration
      });
      const { data } = await api.get(`/course/c/${course._id}`);
      setCourse(data.data);
      setLectureForm({
        title: '',
        description: '',
        sectionTitle: '',
        order: '',
        duration: '',
        tags: '',
        difficulty: 'beginner',
        transcript: '',
        notes: '',
        objectives: '',
        resources: '',
        isPreview: false
      });
      setVideoFile(null);
      setUploadProgress(prev => ({ ...prev, video: 0 }));
    } catch (err) {
      setError(err.response?.data?.message || 'Video upload failed. Please try again.');
    } finally {
      setUploadingVideo(false);
    }
  };

  return (
    <div className="course-editor-page container">
      <header className="course-editor-header">
        <h1>{isEditing ? 'Edit Course' : 'Create Course'}</h1>
        <p>Only the creator of this course can update or delete it.</p>
      </header>

      {error && <p className="form-error">{error}</p>}

      {forbidden ? (
        <Button type="button" variant="secondary" onClick={() => navigate('/instructor')}>
          Back to My Courses
        </Button>
      ) : (
        <>

      <form className="course-editor-form" onSubmit={handleSubmit}>
        <div className="editor-fields">
          <label>Title<input value={form.title} maxLength={100} onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))} required /></label>
          <label>Subtitle<input value={form.subtitle} maxLength={200} onChange={(e) => setForm(prev => ({ ...prev, subtitle: e.target.value }))} /></label>
          <label>Category<input value={form.category} onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))} required /></label>
          <label>Level<select value={form.level} onChange={(e) => setForm(prev => ({ ...prev, level: e.target.value }))}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
          <label>Price<input type="number" min="0" value={form.price} onChange={(e) => setForm(prev => ({ ...prev, price: e.target.value }))} /></label>
          <label>Description<textarea rows={5} value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} /></label>
          <label className="checkbox-line"><input type="checkbox" checked={form.isPublished} onChange={(e) => setForm(prev => ({ ...prev, isPublished: e.target.checked }))} /> Published</label>
        </div>

        <div className="upload-panel">
          <div className="thumbnail-preview">{thumbnailPreview ? <img src={thumbnailPreview} alt="Thumbnail preview" /> : <ImagePlus size={42} />}</div>
          <label className="file-picker"><ImagePlus size={18} /> Select Thumbnail<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleThumbnailSelect(e.target.files?.[0])} /></label>
          {uploadProgress.thumbnail > 0 && <div className="upload-bar"><span style={{ width: `${uploadProgress.thumbnail}%` }}></span><em>{uploadProgress.thumbnail}%</em></div>}
          <Button type="submit" variant="primary" size="large" disabled={submitting || uploadingVideo}><Save size={18} /> {submitting ? 'Saving...' : 'Save Course'}</Button>
        </div>
      </form>

      {course?._id && (
        <section className="lecture-uploader">
          <h2>Add Lecture</h2>
          <form onSubmit={handleAddLecture}>
            <input placeholder="Lecture title" value={lectureForm.title} onChange={(e) => setLectureForm(prev => ({ ...prev, title: e.target.value }))} />
            <textarea placeholder="Lecture description" rows={3} value={lectureForm.description} onChange={(e) => setLectureForm(prev => ({ ...prev, description: e.target.value }))} />
            <label className="checkbox-line"><input type="checkbox" checked={lectureForm.isPreview} onChange={(e) => setLectureForm(prev => ({ ...prev, isPreview: e.target.checked }))} /> Free preview</label>
            <label className="file-picker"><Upload size={18} /> Select Video<input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} /></label>
            {videoFile && <p className="selected-file">{videoFile.name}</p>}
            {uploadingVideo && <div className="upload-bar"><span style={{ width: `${uploadProgress.video}%` }}></span><em>{uploadProgress.video}%</em></div>}
            <Button type="submit" variant="accent" disabled={uploadingVideo || submitting}><Plus size={18} /> {uploadingVideo ? 'Uploading...' : 'Add Lecture'}</Button>
          </form>

          <div className="lecture-list-admin">
            {(course.lectures || []).map((lecture, index) => (
              <div key={lecture._id}><span>{index + 1}. {lecture.title}</span><strong>{lecture.isPreview ? 'Preview' : 'Paid'}</strong></div>
            ))}
          </div>
        </section>
      )}
        </>
      )}
    </div>
  );
};

export default CourseEditor;
