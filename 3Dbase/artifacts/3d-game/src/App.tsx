import { Scene } from "@/components/Scene";
import { WebGLErrorBoundary } from "@/components/WebGLErrorBoundary";

function App() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#7ab8e8",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <WebGLErrorBoundary>
        <Scene />
      </WebGLErrorBoundary>
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          color: "rgba(20, 50, 100, 0.85)",
          fontFamily: "'Inter', sans-serif",
          fontSize: "13px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          pointerEvents: "none",
          userSelect: "none",
          textShadow: "0 1px 4px rgba(255,255,255,0.7)",
        }}
      >
        Niagara Falls — City Tile &nbsp;·&nbsp; Drag to orbit &nbsp;·&nbsp; Scroll to zoom
      </div>
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          color: "rgba(10, 35, 80, 0.92)",
          fontFamily: "'Inter', sans-serif",
          fontSize: "18px",
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          pointerEvents: "none",
          userSelect: "none",
          textShadow: "0 2px 8px rgba(255,255,255,0.8)",
        }}
      >
        Niagara Falls
      </div>
    </div>
  );
}

export default App;
