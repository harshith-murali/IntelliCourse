import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth, useTheme } from '../../hooks';
import { Button } from '../../components';
import { router } from 'expo-router';
import { getUserAvatarUri } from '../../utils/images';

export default function ProfileScreen() {
  const { user, profileVersion, logout, updateProfile } = useAuth();
  const { colors, spacing, radii, shadow, isDark, toggleTheme } = useTheme();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAvatarUri, setEditAvatarUri] = useState<string | null>(null);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        onPress: () => {
          logout();
          router.replace('/auth/login');
        },
        style: 'destructive',
      },
    ]);
  };

  const handleStartEditing = () => {
    setEditName(user?.name || '');
    setEditBio(user?.bio || '');
    setEditEmail(user?.email || '');
    setEditAvatarUri(null);
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim() || !editEmail.trim()) {
      Alert.alert('Error', 'Name and Email are required.');
      return;
    }
    setUpdatingProfile(true);
    try {
      await updateProfile(editName.trim(), editBio.trim(), editEmail.trim(), editAvatarUri || undefined);
      setEditAvatarUri(null);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err) {
      Alert.alert('Update Failed', (err as Error).message);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePickAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please allow access to your media library to choose a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];
      
      // Validate file size (under 2MB)
      if (asset.fileSize && asset.fileSize > 2 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Please select a profile picture smaller than 2MB.');
        return;
      }

      // Validate MIME type
      const fileType = asset.mimeType || 'image/jpeg';
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(fileType)) {
        Alert.alert('Invalid File Type', 'Please select a JPEG, PNG, or WEBP image.');
        return;
      }

      setEditAvatarUri(asset.uri);
    } catch {
      Alert.alert('Error', 'Could not pick avatar image.');
    }
  };


  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={[styles.content, { padding: spacing.lg }]} keyboardShouldPersistTaps="handled">
      
      <LinearGradient colors={[colors.primary, colors.accent, colors.info]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.profileHeader, { borderRadius: radii.xl, paddingVertical: spacing.xl }]}>
        <TouchableOpacity onPress={isEditing ? handlePickAvatar : undefined} disabled={!isEditing} activeOpacity={0.8} style={styles.avatarContainer}>
          <Image 
            key={`profile-avatar-${profileVersion}-${editAvatarUri || user?.avatar || ''}`}
            source={{ uri: editAvatarUri || getUserAvatarUri(user, profileVersion) }} 
            style={[styles.avatar, { borderRadius: radii.full, borderColor: 'rgba(255,255,255,0.92)', borderWidth: 4 }]} 
          />
          {isEditing && (
            <View style={[styles.avatarEditOverlay, { backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: radii.full }]}>
              <Ionicons name="camera" size={20} color="#ffffff" />
            </View>
          )}
        </TouchableOpacity>
        <Text style={[styles.name, { color: '#fff' }]}>{user?.name}</Text>
        <Text style={[styles.email, { color: 'rgba(255,255,255,0.84)', marginBottom: spacing.sm }]}>{user?.email}</Text>
        <View style={[styles.roleBadge, { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: radii.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs }]}>
          <Text style={[styles.roleText, { color: '#fff' }]}>
            {user?.role === 'instructor' ? 'Instructor Account' : 'Student Account'}
          </Text>
        </View>
      </LinearGradient>

      {isEditing ? (
        <View style={[styles.formCard, { backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.lg, marginTop: spacing.lg, borderColor: colors.border, borderWidth: 1, ...shadow }]}>
          <Text style={[styles.formTitle, { color: colors.text, marginBottom: spacing.md }]}>Edit Profile Details</Text>
          
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Full Name *</Text>
            <TextInput
              style={[
                styles.input, 
                { 
                  backgroundColor: colors.background, 
                  borderColor: colors.border, 
                  color: colors.text, 
                  borderRadius: radii.lg, 
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm 
                }
              ]}
              value={editName}
              onChangeText={setEditName}
              placeholder="Enter your name"
              placeholderTextColor={colors.textSecondary}
              editable={!updatingProfile}
            />
          </View>

          <View style={[styles.formGroup, { marginTop: spacing.md }]}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Email Address *</Text>
            <TextInput
              style={[
                styles.input, 
                { 
                  backgroundColor: colors.background, 
                  borderColor: colors.border, 
                  color: colors.text, 
                  borderRadius: radii.lg, 
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm 
                }
              ]}
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="Enter your email"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!updatingProfile}
            />
          </View>

          <View style={[styles.formGroup, { marginTop: spacing.md }]}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Biography</Text>
            <TextInput
              style={[
                styles.input, 
                styles.textArea, 
                { 
                  backgroundColor: colors.background, 
                  borderColor: colors.border, 
                  color: colors.text, 
                  borderRadius: radii.lg, 
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm 
                }
              ]}
              value={editBio}
              onChangeText={setEditBio}
              placeholder="Tell us about yourself..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              editable={!updatingProfile}
            />
          </View>

          {updatingProfile && (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.sm }} />
          )}

          <View style={[styles.buttonRow, { marginTop: spacing.lg, gap: spacing.sm }]}>
            <View style={{ flex: 1 }}>
              <Button
                label="Save Changes"
                onPress={handleSaveProfile}
                loading={updatingProfile}
                disabled={updatingProfile}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label="Cancel"
                onPress={() => setIsEditing(false)}
                variant="secondary"
                disabled={updatingProfile}
              />
            </View>
          </View>
        </View>
      ) : (
        <>
          {/* Bio Section */}
          <View style={[styles.section, { marginTop: spacing.lg }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.sm }]}>Biography</Text>
            <Text style={[styles.bioText, { backgroundColor: colors.surface, color: colors.textSecondary, borderRadius: radii.xl, padding: spacing.lg, borderColor: colors.border, borderWidth: 1, lineHeight: 20, ...shadow }]}>
              {user?.bio || "No biography provided. Click Edit Profile below to add details about yourself."}
            </Text>
          </View>

          {/* Settings Grid */}
          <View style={[styles.section, { marginTop: spacing.md }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.sm }]}>App Settings</Text>

            <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radii.xl, overflow: 'hidden', borderColor: colors.border, borderWidth: 1, ...shadow }]}>
              <TouchableOpacity 
                style={[styles.settingItem, { borderBottomColor: colors.border }]} 
                onPress={handleStartEditing}
                activeOpacity={0.7}
              >
                <Ionicons name="create-outline" size={20} color={colors.primary} />
                <View style={styles.settingContent}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Edit Profile</Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>Update your name, bio, and avatar</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.border} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.settingItem} 
                onPress={toggleTheme}
                activeOpacity={0.7}
              >
                <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color={colors.primary} />
                <View style={styles.settingContent}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Appearance</Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    {isDark ? 'Dark Mode Active' : 'Light Mode Active'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.border} />
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* Log Out button */}
      <Button
        label="Sign Out"
        onPress={handleLogout}
        variant="danger"
        size="large"
        style={{ marginTop: spacing.xl }}
      />

      <View style={[styles.footer, { marginTop: spacing.xxl }]}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>IntelliCourse Premium v1.0.0</Text>
        <Text style={[styles.footerSubtext, { color: isDark ? 'rgba(248, 250, 252, 0.35)' : 'rgba(23, 37, 84, 0.35)' }]}>Powered by React Native</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  profileHeader: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 64,
    height: 64,
  },
  avatarEditOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  email: {
    fontSize: 12,
  },
  roleBadge: {
    borderWidth: 0,
  },
  roleText: {
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  section: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  bioText: {
    fontSize: 13,
  },
  card: {
    borderWidth: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 11,
    marginTop: 1,
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 11,
    fontWeight: '600',
  },
  footerSubtext: {
    fontSize: 9,
    fontWeight: '500',
    marginTop: 2,
  },
  formCard: {
    width: '100%',
    borderWidth: 1,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  formGroup: {
    width: '100%',
    gap: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    fontSize: 14,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
  },
});
