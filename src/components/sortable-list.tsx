"use client";

import { useState, type ReactNode } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
  type SortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type DragHandleProps = {
  attributes: ReturnType<typeof useSortable>["attributes"];
  listeners: ReturnType<typeof useSortable>["listeners"];
};

// 항목을 눌러서 끄는 손잡이(⠿). 행 전체가 아니라 이 버튼만 드래그 시작점으로 삼아야,
// 같은 행 안의 수정/삭제 버튼을 누를 때 드래그와 충돌하지 않는다.
// touchAction: "none"은 모바일에서 손잡이를 누르고 끌 때 화면 스크롤과 겹치지 않게 한다.
export function DragHandle({ attributes, listeners }: DragHandleProps) {
  return (
    <button
      type="button"
      aria-label="드래그해서 순서 변경"
      className="flex h-5 w-5 shrink-0 cursor-grab touch-none items-center justify-center text-neutral-400 hover:text-neutral-600 active:cursor-grabbing dark:hover:text-neutral-300"
      {...attributes}
      {...listeners}
    >
      ⠿
    </button>
  );
}

function SortableRow({ id, children }: { id: string; children: (handle: DragHandleProps) => ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
    >
      {children({ attributes, listeners })}
    </div>
  );
}

// 드래그로 순서를 바꿀 수 있는 목록. 드롭 즉시 화면 순서를 먼저 바꾸고(낙관적 업데이트),
// 서버에는 최종 순서(id 배열)만 넘겨서 저장을 맡긴다.
export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  className,
  strategy = verticalListSortingStrategy,
  dndId,
}: {
  items: T[];
  onReorder: (orderedIds: string[]) => void;
  renderItem: (item: T, handle: DragHandleProps) => ReactNode;
  className?: string;
  // 세로로 한 줄씩 쌓이는 목록은 기본값(verticalListSortingStrategy)이면 되지만, 물품 종류처럼
  // 줄바꿈되는 flex-wrap 목록은 밀어내는 위치 계산이 달라서 rectSortingStrategy를 써야
  // 옆/아래 항목이 자연스럽게 밀리는 모션이 나온다.
  strategy?: SortingStrategy;
  // DndContext는 id를 안 주면 몇 번째로 마운트됐는지에 따라 접근성용 id(DndDescribedBy-N)를
  // 자동으로 매기는데, 이 페이지처럼 DndContext가 여러 개(장르 하나당 캐릭터 목록까지) 있으면
  // 그 순번이 서버 렌더링과 클라이언트 하이드레이션 사이에 어긋나 하이드레이션 경고가 난다.
  // 데이터에서 나온 고정된 id를 직접 넘겨서 순번에 의존하지 않게 한다.
  dndId: string;
}) {
  const [ordered, setOrdered] = useState(items);
  // 다른 조작(추가/삭제/이름변경)으로 목록이 서버에서 다시 내려오면 최신 내용으로 맞춘다.
  // (렌더 중 상태 조정 패턴 — https://react.dev/reference/react/useState#storing-information-from-previous-renders)
  const [prevItems, setPrevItems] = useState(items);
  if (items !== prevItems) {
    setPrevItems(items);
    setOrdered(items);
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = ordered.findIndex((item) => item.id === active.id);
    const newIndex = ordered.findIndex((item) => item.id === over.id);
    const next = arrayMove(ordered, oldIndex, newIndex);
    setOrdered(next);
    onReorder(next.map((item) => item.id));
  }

  return (
    <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ordered.map((item) => item.id)} strategy={strategy}>
        <div className={className}>
          {ordered.map((item) => (
            <SortableRow key={item.id} id={item.id}>
              {(handle) => renderItem(item, handle)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
