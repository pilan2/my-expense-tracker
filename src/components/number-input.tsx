"use client";

// 숫자 입력창에 포커스된 채로 스크롤하면 브라우저가 마우스 휠로 값을 바꿔버려서,
// 포커스를 즉시 풀어(blur) 스크롤이 페이지 스크롤로만 동작하게 만든다.
export function NumberInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} type="number" onWheel={(e) => e.currentTarget.blur()} />;
}
