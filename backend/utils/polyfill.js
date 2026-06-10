import buffer from "buffer";

if (typeof buffer.SlowBuffer === "undefined") {
  buffer.SlowBuffer = buffer.Buffer;
}
