import React, { useState, useEffect, useRef } from 'react'
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  MessageSquare,
  Users,
  Monitor,
  Settings,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  MoreVertical,
  Wifi,
  WifiOff,
  Clock,
  User,
  Crown,
  Camera,
  CameraOff,
  Share,
  X
} from 'lucide-react'

interface Participant {
  id: string
  name: string
  isHost: boolean
  isAudioEnabled: boolean
  isVideoEnabled: boolean
  isActiveSpeaker: boolean
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected'
}

interface VideoCallInterfaceProps {
  conversationUrl: string
  onEndCall: () => void
  participantName?: string
  isHost?: boolean
}

const VideoCallInterface: React.FC<VideoCallInterfaceProps> = ({
  conversationUrl,
  onEndCall,
  participantName = 'You',
  isHost = false
}) => {
  // Call state
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('excellent')
  const [callDuration, setCallDuration] = useState(0)
  const [activeSpeaker, setActiveSpeaker] = useState<string>('larry')

  // Chat state
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string
    sender: string
    message: string
    timestamp: Date
  }>>([])
  const [newMessage, setNewMessage] = useState('')

  // Participants
  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: 'user',
      name: participantName,
      isHost: isHost,
      isAudioEnabled: true,
      isVideoEnabled: true,
      isActiveSpeaker: false,
      connectionQuality: 'excellent'
    },
    {
      id: 'larry',
      name: 'Larry - AI Coach',
      isHost: false,
      isAudioEnabled: true,
      isVideoEnabled: true,
      isActiveSpeaker: true,
      connectionQuality: 'excellent'
    }
  ])

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Connection quality indicator
  const getConnectionIcon = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return <Wifi className="w-4 h-4 text-green-500" />
      case 'good':
        return <Wifi className="w-4 h-4 text-yellow-500" />
      case 'poor':
        return <Wifi className="w-4 h-4 text-red-500" />
      default:
        return <WifiOff className="w-4 h-4 text-gray-500" />
    }
  }

  // Toggle functions
  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled)
    setParticipants(prev => 
      prev.map(p => 
        p.id === 'user' ? { ...p, isAudioEnabled: !isAudioEnabled } : p
      )
    )
  }

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled)
    setParticipants(prev => 
      prev.map(p => 
        p.id === 'user' ? { ...p, isVideoEnabled: !isVideoEnabled } : p
      )
    )
  }

  const toggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: Date.now().toString(),
        sender: participantName,
        message: newMessage.trim(),
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, message])
      setNewMessage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage()
    }
  }

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      {/* Main Video Area */}
      <div className="relative w-full h-full">
        {/* Tavus iframe */}
        <iframe
          ref={iframeRef}
          src={conversationUrl}
          className="w-full h-full border-0"
          allow="camera; microphone; fullscreen; autoplay; display-capture"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-presentation allow-top-navigation-by-user-activation"
          title="Video Call with Larry"
        />

        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4 z-10">
          <div className="flex items-center justify-between">
            {/* Call Info */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-white font-medium">Live Session</span>
              </div>
              <div className="flex items-center space-x-2 text-white/80">
                <Clock className="w-4 h-4" />
                <span className="font-mono">{formatDuration(callDuration)}</span>
              </div>
              <div className="flex items-center space-x-2">
                {getConnectionIcon(connectionQuality)}
                <span className="text-white/80 text-sm capitalize">{connectionQuality}</span>
              </div>
            </div>

            {/* Top Right Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleFullscreen}
                className="p-2 bg-black/30 hover:bg-black/50 text-white rounded-lg transition-colors duration-200"
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}
                className="p-2 bg-black/30 hover:bg-black/50 text-white rounded-lg transition-colors duration-200"
                title="Participants"
              >
                <Users className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Picture-in-Picture Self View */}
        <div className="absolute top-20 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white/20 z-20">
          <div className="relative w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
            {isVideoEnabled ? (
              <div className="text-white text-center">
                <Camera className="w-8 h-8 mx-auto mb-2" />
                <span className="text-sm">Your Video</span>
              </div>
            ) : (
              <div className="text-white text-center">
                <CameraOff className="w-8 h-8 mx-auto mb-2" />
                <span className="text-sm">Video Off</span>
              </div>
            )}
            
            {/* Self view controls */}
            <div className="absolute bottom-2 left-2 right-2 flex justify-center space-x-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                isAudioEnabled ? 'bg-green-500' : 'bg-red-500'
              }`}>
                {isAudioEnabled ? <Mic className="w-3 h-3 text-white" /> : <MicOff className="w-3 h-3 text-white" />}
              </div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                isVideoEnabled ? 'bg-green-500' : 'bg-red-500'
              }`}>
                {isVideoEnabled ? <Video className="w-3 h-3 text-white" /> : <VideoOff className="w-3 h-3 text-white" />}
              </div>
            </div>
          </div>
        </div>

        {/* Active Speaker Indicator */}
        {activeSpeaker && (
          <div className="absolute bottom-24 left-4 bg-black/70 text-white px-3 py-2 rounded-lg z-20">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm">
                {activeSpeaker === 'larry' ? 'Larry is speaking' : `${participantName} is speaking`}
              </span>
            </div>
          </div>
        )}

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 z-10">
          <div className="flex items-center justify-center space-x-4">
            {/* Audio Control */}
            <button
              onClick={toggleAudio}
              className={`p-4 rounded-full transition-all duration-200 ${
                isAudioEnabled 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
              title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
            >
              {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </button>

            {/* Video Control */}
            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition-all duration-200 ${
                isVideoEnabled 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
              title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </button>

            {/* Screen Share */}
            <button
              onClick={toggleScreenShare}
              className={`p-4 rounded-full transition-all duration-200 ${
                isScreenSharing 
                  ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
              title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
            >
              <Monitor className="w-6 h-6" />
            </button>

            {/* Chat Toggle */}
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`p-4 rounded-full transition-all duration-200 ${
                isChatOpen 
                  ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
              title="Toggle chat"
            >
              <MessageSquare className="w-6 h-6" />
            </button>

            {/* Settings */}
            <button
              className="p-4 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition-all duration-200"
              title="Settings"
            >
              <Settings className="w-6 h-6" />
            </button>

            {/* End Call */}
            <button
              onClick={onEndCall}
              className="p-4 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all duration-200"
              title="End call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Participants Sidebar */}
      {isParticipantsOpen && (
        <div className="absolute top-0 right-0 w-80 h-full bg-gray-800 border-l border-gray-700 z-30">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Participants ({participants.length})</h3>
              <button
                onClick={() => setIsParticipantsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-4 space-y-3">
            {participants.map((participant) => (
              <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    {participant.isActiveSpeaker && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800 flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium">{participant.name}</span>
                      {participant.isHost && <Crown className="w-4 h-4 text-yellow-500" />}
                    </div>
                    <div className="flex items-center space-x-1">
                      {getConnectionIcon(participant.connectionQuality)}
                      <span className="text-gray-400 text-xs capitalize">{participant.connectionQuality}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    participant.isAudioEnabled ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {participant.isAudioEnabled ? <Mic className="w-3 h-3 text-white" /> : <MicOff className="w-3 h-3 text-white" />}
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    participant.isVideoEnabled ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {participant.isVideoEnabled ? <Video className="w-3 h-3 text-white" /> : <VideoOff className="w-3 h-3 text-white" />}
                  </div>
                  {participant.id !== 'user' && (
                    <button className="text-gray-400 hover:text-white">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Panel */}
      {isChatOpen && (
        <div className="absolute top-0 right-0 w-80 h-full bg-gray-800 border-l border-gray-700 z-30 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Chat</h3>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {chatMessages.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                <p>No messages yet</p>
                <p className="text-sm">Start the conversation!</p>
              </div>
            ) : (
              chatMessages.map((message) => (
                <div key={message.id} className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-medium text-sm">{message.sender}</span>
                    <span className="text-gray-400 text-xs">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3">
                    <p className="text-white text-sm">{message.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Chat Input */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <input
                ref={chatInputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white rounded-lg transition-colors duration-200"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VideoCallInterface