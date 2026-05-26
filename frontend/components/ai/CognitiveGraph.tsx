"use client";

import { useEffect, useState } from "react";

import ReactFlow, {

  Background,
  Controls,
  MiniMap

} from "reactflow";

import "reactflow/dist/style.css";


type GraphNode = {

  id: string;

  type: string;

  data: {
    label: string;
    domain: string;
    importance: number;
  };

  position: {
    x: number;
    y: number;
  };
};


type GraphEdge = {

  id: string;

  source: string;

  target: string;

  label: string;
};


export default function CognitiveGraph({

  roomId

}: {

  roomId: number
}) {

  const [nodes, setNodes] = useState<
    GraphNode[]
  >([]);

  const [edges, setEdges] = useState<
    GraphEdge[]
  >([]);

  useEffect(() => {

    fetch(

      `http://127.0.0.1:8000/ai/graph/${roomId}`

    )

      .then(res => res.json())

      .then(data => {

        setNodes(data.nodes);

        setEdges(data.edges);

      });

  }, [roomId]);


  return (

    <div className="w-full h-[800px] rounded-xl overflow-hidden border">

      <ReactFlow

        nodes={nodes}

        edges={edges}

        fitView

      >

        <MiniMap />

        <Controls />

        <Background />

      </ReactFlow>

    </div>
  );
}