import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class WebGLErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(160, 200, 255, 0.8)",
            fontFamily: "'Inter', sans-serif",
            textAlign: "center",
            gap: "16px",
          }}
        >
          <div style={{ fontSize: "48px" }}>🏙️</div>
          <div style={{ fontSize: "20px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Niagara Falls — City Tile
          </div>
          <div style={{ fontSize: "13px", color: "rgba(120, 170, 220, 0.6)", maxWidth: "360px", lineHeight: 1.6 }}>
            WebGL is required to render this 3D scene. Please ensure your browser
            supports WebGL and hardware acceleration is enabled.
          </div>
          <div style={{ fontSize: "11px", color: "rgba(100, 140, 180, 0.4)", marginTop: "8px" }}>
            {this.state.errorMessage}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
