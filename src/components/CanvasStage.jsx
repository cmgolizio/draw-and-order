import { Stage, Layer, Line, Image as KonvaImage } from "react-konva";

export default function CanvasStage({
  stageRef,
  stageSize,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  suspectImage,
  silhouetteImage,
  showSuspectImage,
  showSilhouette,
  lines,
}) {
  return (
    <Stage
      ref={stageRef}
      width={stageSize.width}
      height={stageSize.height}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
      className='bg-white rounded-md touch-none'
    >
      <Layer listening={false}>
        {/* {suspectImage && ( */}
        {suspectImage && showSuspectImage && (
          <KonvaImage
            image={suspectImage}
            width={stageSize.width}
            height={stageSize.height}
          />
        )}
        {silhouetteImage && showSilhouette && (
          <KonvaImage
            image={silhouetteImage}
            width={stageSize.width}
            height={stageSize.height}
            opacity={0.28}
          />
        )}
      </Layer>
      <Layer>
        {lines.map((line, i) => (
          <Line
            key={i}
            points={line.points}
            stroke={line.tool === "eraser" ? "#ffffff" : line.color}
            strokeWidth={line.strokeWidth}
            tension={0.5}
            lineCap='round'
            lineJoin='round'
            globalCompositeOperation={
              line.tool === "eraser" ? "destination-out" : "source-over"
            }
          />
        ))}
      </Layer>
    </Stage>
  );
}
