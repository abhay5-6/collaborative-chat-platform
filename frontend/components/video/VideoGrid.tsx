import { useEffect, useRef } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";

interface VideoPlayerProps {
  stream: MediaStream;
  muted?: boolean;
  username: string;
}

function VideoPlayer({ stream, muted = false, username }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-muted border border-border aspect-video shadow-lg">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-3 left-3 bg-background/60 backdrop-blur-md px-3 py-1 rounded-lg text-sm text-foreground font-medium">
        {username}
      </div>
    </div>
  );
}

interface VideoGridProps {
  localStream: MediaStream | null;
  remoteStreams: { [username: string]: MediaStream };
  onLeaveCall: () => void;
  currentUser: string;
}

export default function VideoGrid({ localStream, remoteStreams, onLeaveCall, currentUser }: VideoGridProps) {
  const totalStreams = (localStream ? 1 : 0) + Object.keys(remoteStreams).length;

  const gridCols = totalStreams === 1 ? 'grid-cols-1' : 
                   totalStreams === 2 ? 'grid-cols-2' : 
                   totalStreams <= 4 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div className="flex flex-col h-64 md:h-96 w-full gap-4 mb-4">
      <div className={`grid ${gridCols} gap-4 h-full flex-1 overflow-y-auto`}>
        {localStream && (
          <VideoPlayer stream={localStream} muted={true} username={`${currentUser} (You)`} />
        )}
        
        {Object.entries(remoteStreams).map(([username, stream]) => (
          <VideoPlayer key={username} stream={stream} username={username} />
        ))}
      </div>

      <div className="flex justify-center items-center gap-4 py-2">
        <button className="h-12 w-12 rounded-full bg-card flex items-center justify-center hover:bg-zinc-700 transition">
          <Mic size={20} className="text-foreground" />
        </button>
        <button className="h-12 w-12 rounded-full bg-card flex items-center justify-center hover:bg-zinc-700 transition">
          <Video size={20} className="text-foreground" />
        </button>
        <button 
          onClick={onLeaveCall}
          className="h-12 w-16 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition shadow-lg shadow-red-500/20"
        >
          <PhoneOff size={20} className="text-foreground" />
        </button>
      </div>
    </div>
  );
}
