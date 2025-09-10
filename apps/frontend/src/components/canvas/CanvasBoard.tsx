'use client';

import React, {
  useEffect,
  useImperativeHandle,
  useRef,
  forwardRef,
} from 'react';
import * as fabric from 'fabric';
import { throttle } from '@/utils/throttle';

export interface CanvasBoardRef {
  addPath: (pathData: SerializedPath) => void;
  clearCanvas: () => void;
}

export type SerializedPath = {
  path: string;
} & Partial<fabric.TOptions<fabric.PathProps>>;

interface CanvasBoardProps {
  isDrawer: boolean;
  onDraw?: (pathData: SerializedPath) => void;
}

const CanvasBoard = forwardRef<CanvasBoardRef, CanvasBoardProps>(
  ({ isDrawer, onDraw }, ref) => {
    const canvasElRef = useRef<HTMLCanvasElement | null>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

    const throttledOnDraw = useRef(
      throttle((data: SerializedPath) => {
        onDraw?.(data);
      }, 100)
    ).current;
     useImperativeHandle(ref, () => ({
      addPath: (pathData) => {
        if (!fabricCanvasRef.current) return;
        
          const { path, ...rest } = pathData;

          const pathObj = new fabric.Path(path, {
            ...rest,
            selectable: false,
          });

          fabricCanvasRef.current.add(pathObj);
          fabricCanvasRef.current.renderAll();
      },
      clearCanvas: () => {
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.clear();
          fabricCanvasRef.current.backgroundColor = 'white'; 
          fabricCanvasRef.current.renderAll();
        }
      },
      
    }));
    useEffect(() => {
      if (!canvasElRef.current) return;

      const canvas = new fabric.Canvas(canvasElRef.current, {
        isDrawingMode: isDrawer,
        backgroundColor: 'white',
        selection: false,
      });

      if (isDrawer) {
        const brush = new fabric.PencilBrush(canvas);
        brush.color = 'black';
        brush.width = 3;
        canvas.freeDrawingBrush = brush;
      }

      fabricCanvasRef.current = canvas;

      canvas.on('path:created', (event) => {
        if (isDrawer && onDraw && event.path) {
          // caching the path --> still not tested
          // event.path.set({ selectable: false, objectCaching: true });
          const serialized = event.path.toObject(['path']) as SerializedPath;
          throttledOnDraw(serialized);
        }
      });

      return () => {
        canvas.dispose();
        fabricCanvasRef.current = null;
      };
    }, [isDrawer]);

    return (
      <div className="w-full flex justify-center items-center">
        <canvas
          ref={canvasElRef}
          width={800}
          height={500}
          className="border border-gray-400 rounded shadow"
        />
      </div>
    );
  }
);

CanvasBoard.displayName = 'CanvasBoard';
export default CanvasBoard;
