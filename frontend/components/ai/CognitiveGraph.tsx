"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import ReactFlow, {

  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Handle,
  Position,

} from "reactflow";

import {
  Brain,
  Network,
  Sparkles,
} from "lucide-react";

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


function getDomainColor(
  domain: string
) {

  const lower =
    domain.toLowerCase();

  if (
    lower.includes(
      "architecture"
    )
  ) {
    return "from-cyan-500 to-blue-500";
  }

  if (
    lower.includes(
      "backend"
    )
  ) {
    return "from-purple-500 to-pink-500";
  }

  if (
    lower.includes(
      "frontend"
    )
  ) {
    return "from-orange-500 to-yellow-500";
  }

  if (
    lower.includes(
      "database"
    )
  ) {
    return "from-emerald-500 to-green-500";
  }

  return "from-neutral-700 to-neutral-500";
}


function CognitiveNode({

  data

}: any) {

  const gradient =
    getDomainColor(
      data.domain
    );

  return (

    <div
      className={`
        min-w-[260px]
        max-w-[300px]
        rounded-2xl
        border
        border-neutral-800
        bg-neutral-950/95
        backdrop-blur-xl
        shadow-2xl
        overflow-hidden
      `}
    >

      <Handle
        type="target"
        position={Position.Top}
        className="bg-white"
      />

      {/* TOP BAR */}

      <div className={`
        h-1 w-full
        bg-gradient-to-r
        ${gradient}
      `} />

      <div className="
        p-4
      ">

        <div className="
          flex
          items-center
          justify-between
          mb-3
        ">

          <div className="
            flex
            items-center
            gap-2
            text-xs
            text-neutral-400
            uppercase
            tracking-wide
          ">

            <Brain size={14} />

            Memory Node

          </div>

          <div className="
            flex
            items-center
            gap-1
            text-yellow-400
            text-xs
          ">

            <Sparkles size={12} />

            {data.importance}

          </div>

        </div>


        <div className="
          text-sm
          leading-relaxed
          text-neutral-100
          font-medium
          mb-4
        ">

          {data.label}

        </div>


        <div className="
          flex
          items-center
          gap-2
          text-[11px]
          text-neutral-500
        ">

          <Network size={11} />

          {data.domain}

        </div>

      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="bg-white"
      />

    </div>
  );
}


export default function CognitiveGraph({

  roomId

}: {

  roomId: number
}) {

  const [nodes, setNodes] =
    useState<Node[]>([]);

  const [edges, setEdges] =
    useState<Edge[]>([]);

  const [loading, setLoading] =
    useState(true);


  useEffect(() => {

    async function loadGraph() {

      try {

        const res = await fetch(

          `http://127.0.0.1:8000/ai/graph/${roomId}`
        );

        const data =
          await res.json();

        setNodes(data.nodes);

        setEdges(data.edges);

      } catch (error) {

        console.error(
          "GRAPH LOAD ERROR",
          error
        );

      } finally {

        setLoading(false);
      }
    }

    loadGraph();

  }, [roomId]);


  const nodeTypes = useMemo(() => ({

    cognitiveNode:
      CognitiveNode,

  }), []);


  const transformedNodes = useMemo(() => (

    nodes.map((node: any) => ({

      ...node,

      type: "cognitiveNode",
    }))

  ), [nodes]);


  if (loading) {

    return (

      <div className="
        h-[800px]
        rounded-3xl
        border
        border-neutral-800
        bg-neutral-950
        flex
        items-center
        justify-center
        text-neutral-500
      ">

        Loading cognition graph...

      </div>
    );
  }


  return (

    <div className="
      w-full
      h-[800px]
      rounded-3xl
      overflow-hidden
      border
      border-neutral-800
      bg-black
      shadow-2xl
    ">

      <ReactFlow

        nodes={transformedNodes}

        edges={edges}

        fitView

        nodeTypes={nodeTypes}

        proOptions={{
          hideAttribution: true
        }}

      >

        <MiniMap
          pannable
          zoomable
          className="
            !bg-neutral-950
            !border
            !border-neutral-800
          "
        />

        <Controls
          className="
            !bg-neutral-950
            !border-neutral-800
          "
        />

        <Background
          gap={24}
          size={1}
          color="#222"
        />

      </ReactFlow>

    </div>
  );
}