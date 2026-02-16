"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { MessageCircle, Clock, X, Minimize2, Maximize2, GripVertical } from "lucide-react";
import { useSessionNotification } from "./SessionNotificationProvider";

export function SessionFloatingBubble() {
  const router = useRouter();
  const pathname = usePathname();
  const { activeSession, setActiveSession, isMinimized, setIsMinimized } = useSessionNotification();
  const [remainingSec, setRemainingSec] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  // Draggable state
  const [position, setPosition] = useState({ x: 16, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasBeenDragged, setHasBeenDragged] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const initialMousePos = useRef({ x: 0, y: 0 });

  const isOnSessionPage = pathname?.includes("/session/");

  useEffect(() => {
    if (activeSession && !isOnSessionPage) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [activeSession, isOnSessionPage]);

  useEffect(() => {
    if (!activeSession || activeSession.status !== "active" || !activeSession.endsAt) {
      setRemainingSec(null);
      return;
    }

    const tick = () => {
      const sec = Math.max(0, Math.floor((activeSession.endsAt!.getTime() - Date.now()) / 1000));
      setRemainingSec(sec);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeSession]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    
    setIsDragging(true);
    setHasBeenDragged(true);
    initialMousePos.current = { x: e.clientX, y: e.clientY };
    dragStartPos.current = { ...position };
    e.preventDefault();
  }, [position]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    
    setIsDragging(true);
    setHasBeenDragged(true);
    const touch = e.touches[0];
    initialMousePos.current = { x: touch.clientX, y: touch.clientY };
    dragStartPos.current = { ...position };
  }, [position]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - initialMousePos.current.x;
      const dy = e.clientY - initialMousePos.current.y;
      
      const newX = Math.max(0, Math.min(window.innerWidth - 320, dragStartPos.current.x - dx));
      const newY = Math.max(0, Math.min(window.innerHeight - 200, dragStartPos.current.y - dy));
      
      setPosition({ x: newX, y: newY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const dx = touch.clientX - initialMousePos.current.x;
      const dy = touch.clientY - initialMousePos.current.y;
      
      const newX = Math.max(0, Math.min(window.innerWidth - 320, dragStartPos.current.x - dx));
      const newY = Math.max(0, Math.min(window.innerHeight - 200, dragStartPos.current.y - dy));
      
      setPosition({ x: newX, y: newY });
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleRejoin = () => {
    if (!activeSession) return;
    const path = activeSession.userRole === "doctor" 
      ? `/doctor/session/${activeSession.appointmentId}`
      : `/patient/session/${activeSession.appointmentId}`;
    router.push(path);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible || !activeSession) return null;

  const getStatusColor = () => {
    switch (activeSession.status) {
      case "active":
        return "bg-[#14b6a6]";
      case "waiting":
        return "bg-amber-500";
      case "ended":
        return "bg-gray-500";
      default:
        return "bg-blue-500";
    }
  };

  const getStatusText = () => {
    switch (activeSession.status) {
      case "active":
        return remainingSec !== null ? formatTime(remainingSec) : "Active";
      case "waiting":
        return "Waiting";
      case "ended":
        return "Ended";
      default:
        return "Session";
    }
  };

  const positionStyles = hasBeenDragged 
    ? { right: `${position.x}px`, bottom: `${position.y}px` }
    : { right: '16px', bottom: '16px' };

  if (isMinimized) {
    return (
      <div 
        ref={dragRef}
        className="fixed z-50 cursor-grab active:cursor-grabbing"
        style={positionStyles}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div 
          onClick={() => !isDragging && setIsMinimized(false)}
          className={`${getStatusColor()} text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow animate-pulse cursor-pointer`}
        >
          <MessageCircle className="w-6 h-6" />
        </div>
        {remainingSec !== null && remainingSec < 300 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            !
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      ref={dragRef}
      className="fixed z-50 w-80"
      style={positionStyles}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-border overflow-hidden">
        <div 
          className={`${getStatusColor()} text-white px-4 py-3 flex items-center justify-between cursor-grab active:cursor-grabbing`}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 opacity-50" />
            <MessageCircle className="w-5 h-5" />
            <span className="font-semibold text-sm">
              {activeSession.status === "active" ? "Consultation Active" : 
               activeSession.status === "waiting" ? "Waiting Room" : "Session Ended"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              title="Minimize"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-text-secondary">With</p>
              <p className="font-semibold text-text-primary">{activeSession.otherPartyName}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-text-secondary">Status</p>
              <div className="flex items-center gap-1 font-semibold text-text-primary">
                {activeSession.status === "active" && <Clock className="w-4 h-4" />}
                {getStatusText()}
              </div>
            </div>
          </div>

          {activeSession.status !== "ended" && (
            <button
              onClick={handleRejoin}
              className="w-full bg-[#14b6a6] hover:bg-[#0d9488] text-white font-medium py-2 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Maximize2 className="w-4 h-4" />
              Rejoin Session
            </button>
          )}

          {activeSession.status === "ended" && (
            <button
              onClick={() => {
                setActiveSession(null);
                setIsVisible(false);
              }}
              className="w-full bg-subtle hover:bg-border text-text-primary font-medium py-2 px-4 rounded-xl transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
