import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  Text3D, 
  Box, 
  Sphere, 
  Plane, 
  Html,
  useTexture,
  Environment,
  PerspectiveCamera
} from '@react-three/drei';
import { motion } from 'framer-motion';
import { Vector3 } from 'three';
import { Eye, Headphones, Settings, Maximize } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface ARVRProps {
  data: {
    revenue: number;
    costs: number;
    marketSegments: Array<{
      name: string;
      value: number;
      growth: number;
    }>;
  };
  onDataPointClick?: (data: any) => void;
}

const FloatingDataPoint: React.FC<{
  position: [number, number, number];
  data: any;
  color: string;
  onClick?: () => void;
}> = ({ position, data, color, onClick }) => {
  const meshRef = useRef<any>();
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime) * 0.2;
    }
  });

  return (
    <group>
      <Sphere
        ref={meshRef}
        position={position}
        args={[hovered ? 0.6 : 0.5]}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial color={color} transparent opacity={0.8} />
      </Sphere>

      {hovered && (
        <Html position={[position[0], position[1] + 1, position[2]]}>
          <Card className="p-3 bg-black/80 border-white/20 backdrop-blur-sm">
            <div className="text-white text-sm">
              <div className="font-bold">{data.label}</div>
              <div className="text-white/80">{data.value}</div>
            </div>
          </Card>
        </Html>
      )}
    </group>
  );
};

const VirtualEnvironment: React.FC<ARVRProps> = ({ data, onDataPointClick }) => {
  const { camera } = useThree();

  const dataPoints = [
    {
      position: [-4, 2, 0] as [number, number, number],
      data: { label: 'Revenue', value: `$${(data.revenue / 1000000).toFixed(1)}M` },
      color: '#4CAF50'
    },
    {
      position: [0, 0, 0] as [number, number, number],
      data: { label: 'Costs', value: `$${(data.costs / 1000000).toFixed(1)}M` },
      color: '#F44336'
    },
    {
      position: [4, 1, 0] as [number, number, number],
      data: { label: 'Profit', value: `$${((data.revenue - data.costs) / 1000000).toFixed(1)}M` },
      color: '#2196F3'
    }
  ];

  return (
    <>
      {/* Environment */}
      <Environment preset="night" />
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} />
      <pointLight position={[-10, -10, -10]} color="#4a00ff" />

      {/* Controls */}
      <OrbitControls 
        enableZoom={true} 
        enablePan={true}
        maxPolarAngle={Math.PI / 2}
        minDistance={5}
        maxDistance={20}
      />

      {/* Data Points */}
      {dataPoints.map((point, index) => (
        <FloatingDataPoint
          key={index}
          position={point.position}
          data={point.data}
          color={point.color}
          onClick={() => onDataPointClick?.(point.data)}
        />
      ))}

      {/* Market Segments Ring */}
      {data.marketSegments.map((segment, index) => {
        const angle = (index / data.marketSegments.length) * Math.PI * 2;
        const radius = 6;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        return (
          <FloatingDataPoint
            key={`segment-${index}`}
            position={[x, -2, z]}
            data={{ label: segment.name, value: `${segment.growth}% growth` }}
            color={`hsl(${index * 60}, 70%, 50%)`}
            onClick={() => onDataPointClick?.(segment)}
          />
        );
      })}

      {/* Central Platform */}
      <Box position={[0, -4, 0]} args={[12, 0.2, 12]}>
        <meshStandardMaterial color="#1a1a2e" transparent opacity={0.3} />
      </Box>

      {/* Title */}
      <Text3D
        font="/fonts/helvetiker_regular.typeface.json"
        size={0.8}
        height={0.1}
        position={[0, 6, 0]}
      >
        NXD Investment Portal
        <meshStandardMaterial color="#fff" />
      </Text3D>
    </>
  );
};

const ARVRInterface: React.FC<ARVRProps> = ({ data, onDataPointClick }) => {
  const [isVRMode, setIsVRMode] = useState(false);
  const [isARMode, setIsARMode] = useState(false);
  const [selectedData, setSelectedData] = useState<any>(null);

  const handleDataClick = (dataPoint: any) => {
    setSelectedData(dataPoint);
    onDataPointClick?.(dataPoint);
  };

  const enterVRMode = async () => {
    try {
      // Request VR session (WebXR)
      if ('xr' in navigator) {
        const xrSupported = await (navigator as any).xr.isSessionSupported('immersive-vr');
        if (xrSupported) {
          setIsVRMode(true);
        } else {
          // Fallback to fullscreen immersive mode
          setIsVRMode(true);
        }
      }
    } catch (error) {
      console.warn('VR not supported, using fullscreen mode');
      setIsVRMode(true);
    }
  };

  const enterARMode = async () => {
    try {
      // Request camera access for AR
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setIsARMode(true);
    } catch (error) {
      console.warn('Camera access denied, AR mode unavailable');
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex space-x-2">
        <Button
          onClick={enterVRMode}
          variant={isVRMode ? "default" : "outline"}
          size="sm"
        >
          <Eye className="w-4 h-4 mr-2" />
          VR Mode
        </Button>
        <Button
          onClick={enterARMode}
          variant={isARMode ? "default" : "outline"}
          size="sm"
        >
          <Headphones className="w-4 h-4 mr-2" />
          AR Mode
        </Button>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* 3D Canvas */}
      <div className={`w-full ${isVRMode ? 'h-screen fixed inset-0 z-50' : 'h-96'} bg-black rounded-lg overflow-hidden`}>
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 5, 10]} />
          <VirtualEnvironment data={data} onDataPointClick={handleDataClick} />
        </Canvas>
      </div>

      {/* Data Panel */}
      {selectedData && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute bottom-4 right-4 z-10"
        >
          <Card className="p-4 bg-black/80 border-white/20 backdrop-blur-sm">
            <h4 className="text-lg font-bold text-white mb-2">{selectedData.label}</h4>
            <p className="text-white/80">{selectedData.value}</p>
            <Button
              className="mt-2 w-full"
              size="sm"
              onClick={() => setSelectedData(null)}
            >
              Close
            </Button>
          </Card>
        </motion.div>
      )}

      {/* VR Exit Button */}
      {isVRMode && (
        <Button
          onClick={() => setIsVRMode(false)}
          className="fixed top-4 left-4 z-50"
          variant="outline"
        >
          Exit VR
        </Button>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 z-10">
        <Card className="p-3 bg-black/60 border-white/20 backdrop-blur-sm">
          <div className="text-white/80 text-sm">
            <div>🖱️ Click and drag to rotate</div>
            <div>🔍 Scroll to zoom</div>
            <div>👆 Click spheres for details</div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ARVRInterface;