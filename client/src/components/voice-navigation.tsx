import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Settings,
  Command,
  Navigation as NavigationIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VoiceCommand {
  command: string;
  action: () => void;
  description: string;
  category: 'navigation' | 'action' | 'system';
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function VoiceNavigation() {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [lastCommand, setLastCommand] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  
  const [, setLocation] = useLocation();
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Voice commands configuration
  const voiceCommands: VoiceCommand[] = [
    // Navigation commands
    { 
      command: "go to dashboard", 
      action: () => setLocation("/dashboard"), 
      description: "Navigate to dashboard",
      category: "navigation"
    },
    { 
      command: "go to domains", 
      action: () => setLocation("/domains"), 
      description: "Navigate to domains page",
      category: "navigation"
    },
    { 
      command: "go to staking", 
      action: () => setLocation("/staking"), 
      description: "Navigate to staking page",
      category: "navigation"
    },
    { 
      command: "go to governance", 
      action: () => setLocation("/governance"), 
      description: "Navigate to governance page",
      category: "navigation"
    },
    { 
      command: "go to marketplace", 
      action: () => setLocation("/marketplace"), 
      description: "Navigate to marketplace",
      category: "navigation"
    },
    { 
      command: "go to admin", 
      action: () => setLocation("/admin"), 
      description: "Navigate to admin panel",
      category: "navigation"
    },
    { 
      command: "go home", 
      action: () => setLocation("/"), 
      description: "Navigate to home page",
      category: "navigation"
    },
    
    // Action commands
    { 
      command: "check domain", 
      action: () => {
        setLocation("/domains");
        speak("Opened domain checker");
      }, 
      description: "Open domain availability checker",
      category: "action"
    },
    { 
      command: "connect wallet", 
      action: () => {
        // Trigger wallet connection
        const connectButton = document.querySelector('[data-testid="connect-wallet"]') as HTMLElement;
        if (connectButton) {
          connectButton.click();
          speak("Opening wallet connection");
        } else {
          speak("Wallet connection not available");
        }
      }, 
      description: "Connect crypto wallet",
      category: "action"
    },
    { 
      command: "show help", 
      action: () => {
        setIsExpanded(true);
        speak("Showing voice commands");
      }, 
      description: "Show available voice commands",
      category: "system"
    },
    { 
      command: "toggle theme", 
      action: () => {
        const themeButton = document.querySelector('[data-testid="theme-toggle"]') as HTMLElement;
        if (themeButton) {
          themeButton.click();
          speak("Theme toggled");
        }
      }, 
      description: "Toggle light/dark theme",
      category: "system"
    },
    
    // Advanced commands
    { 
      command: "start listening", 
      action: () => startListening(), 
      description: "Start voice recognition",
      category: "system"
    },
    { 
      command: "stop listening", 
      action: () => stopListening(), 
      description: "Stop voice recognition",
      category: "system"
    },
    { 
      command: "repeat", 
      action: () => {
        if (lastCommand) {
          speak(`Last command was: ${lastCommand}`);
        } else {
          speak("No previous command");
        }
      }, 
      description: "Repeat last command",
      category: "system"
    }
  ];

  useEffect(() => {
    // Check if Speech Recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      setupSpeechRecognition();
    }

    // Check if Speech Synthesis is supported
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const setupSpeechRecognition = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
          setConfidence(result[0].confidence);
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);

      if (finalTranscript) {
        processVoiceCommand(finalTranscript.toLowerCase().trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      if (event.error === 'not-allowed') {
        speak("Microphone permission denied. Please enable microphone access.");
      } else if (event.error === 'no-speech') {
        speak("No speech detected. Please try again.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  const processVoiceCommand = (command: string) => {
    const matchedCommand = voiceCommands.find(cmd => 
      command.includes(cmd.command.toLowerCase())
    );

    if (matchedCommand) {
      setLastCommand(matchedCommand.command);
      matchedCommand.action();
      speak(`Executing: ${matchedCommand.description}`);
    } else {
      // Try fuzzy matching
      const fuzzyMatch = voiceCommands.find(cmd => {
        const words = cmd.command.toLowerCase().split(' ');
        return words.some(word => command.includes(word));
      });

      if (fuzzyMatch) {
        setLastCommand(fuzzyMatch.command);
        fuzzyMatch.action();
        speak(`Executing: ${fuzzyMatch.description}`);
      } else {
        // Send unrecognized commands to AI for natural language processing
        fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: `Voice command: ${command}`,
            conversation_id: 'voice-navigation'
          })
        })
        .then(response => response.json())
        .then(data => {
          speak(data.message || data.response || "I understood your request, but I'm not sure how to help with that.");
        })
        .catch(error => {
          console.error('Voice AI error:', error);
          speak("I didn't understand that command. Say 'show help' to see available commands.");
        });
      }
    }
  };

  const speak = (text: string) => {
    if (!speechEnabled || !synthRef.current) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;

    // Use a pleasant voice if available
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.lang.startsWith('en') && 
      (voice.name.includes('Female') || voice.name.includes('Google') || voice.name.includes('Microsoft'))
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    synthRef.current.speak(utterance);
  };

  const startListening = () => {
    if (!recognitionRef.current || isListening) return;

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      speak("Failed to start voice recognition");
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;

    recognitionRef.current.stop();
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const groupedCommands = voiceCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, VoiceCommand[]>);

  if (!isSupported) {
    return (
      <Card className="fixed bottom-4 right-4 w-80 bg-red-500/10 border-red-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-red-400">
            <MicOff className="w-4 h-4" />
            <span className="text-sm">Voice navigation not supported in this browser</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4"
          >
            <Card className="w-96 max-h-96 overflow-y-auto bg-background/95 backdrop-blur-sm border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Command className="w-4 h-4" />
                    Voice Commands
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsExpanded(false)}
                  >
                    ×
                  </Button>
                </div>

                {Object.entries(groupedCommands).map(([category, commands]) => (
                  <div key={category} className="mb-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 capitalize">
                      {category}
                    </h4>
                    <div className="space-y-1">
                      {commands.map((cmd, index) => (
                        <div key={index} className="flex justify-between items-center p-2 rounded bg-muted/50">
                          <span className="text-sm font-mono">{cmd.command}</span>
                          <span className="text-xs text-muted-foreground">{cmd.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSpeechEnabled(!speechEnabled)}
                    className="flex items-center gap-1"
                  >
                    {speechEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                    {speechEnabled ? 'Mute' : 'Unmute'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="bg-background/95 backdrop-blur-sm border-primary/20">
        <CardContent className="p-4">
          {transcript && (
            <div className="mb-3">
              <div className="text-xs text-muted-foreground mb-1">Listening:</div>
              <div className="text-sm font-mono bg-muted/50 p-2 rounded">{transcript}</div>
              {confidence > 0 && (
                <div className="mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(confidence * 100)}% confidence
                  </Badge>
                </div>
              )}
            </div>
          )}

          {lastCommand && (
            <div className="mb-3">
              <div className="text-xs text-muted-foreground mb-1">Last command:</div>
              <Badge variant="outline" className="text-xs">{lastCommand}</Badge>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              onClick={toggleListening}
              variant={isListening ? "destructive" : "default"}
              size="sm"
              className="flex items-center gap-2"
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4" />
                  Stop
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Listen
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Settings className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-1">
              {isListening && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-2 h-2 bg-red-500 rounded-full"
                />
              )}
              <NavigationIcon className={`w-4 h-4 ${isListening ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}