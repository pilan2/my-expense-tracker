// 사진 업로드 흐름은 두 단계다: (1) 회전을 먼저 확정해서 실제로 회전된 이미지를 만들고,
// (2) 그 결과물 위에서 자유 비율로 자른다. 이렇게 나누면 "회전하면서 동시에 자르기" 좌표
// 계산을 안 해도 돼서 훨씬 안전하다(자르기는 react-image-crop이 제공하는 cropToCanvas를
// 그대로 쓴다).

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });
}

function getRadianAngle(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

// 회전된 이미지를 그대로 담기 위해 필요한 최소 캔버스 크기.
function getRotatedSize(width: number, height: number, rotation: number) {
  const rad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rad) * width) + Math.abs(Math.sin(rad) * height),
    height: Math.abs(Math.sin(rad) * width) + Math.abs(Math.cos(rad) * height),
  };
}

// 원본 이미지를 주어진 각도로 회전시킨 새 이미지를 만든다(회전 부분만 담당, 자르기는 하지 않음).
export async function rotateImage(imageSrc: string, rotation: number): Promise<Blob> {
  const image = await createImage(imageSrc);
  if (rotation === 0) {
    // 회전이 없으면 그대로 캔버스에 옮겨 담기만 한다(다음 단계 입력 형식을 통일하기 위해).
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("이미지 처리에 실패했습니다.");
    ctx.drawImage(image, 0, 0);
    return canvasToBlob(canvas);
  }

  const { width, height } = getRotatedSize(image.naturalWidth, image.naturalHeight, rotation);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지 처리에 실패했습니다.");
  ctx.translate(width / 2, height / 2);
  ctx.rotate(getRadianAngle(rotation));
  ctx.translate(-image.naturalWidth / 2, -image.naturalHeight / 2);
  ctx.drawImage(image, 0, 0);
  return canvasToBlob(canvas);
}

// 화면에 렌더링된 <img>의 CSS 크기를 기준으로 스케일을 계산하면, 드래그를 끝낸 시점과
// "적용"을 누른 시점 사이에 레이아웃이 살짝이라도 바뀔 때(모바일 브라우저 주소창이
// 나타나거나 사라지면서 뷰포트 높이가 바뀌는 경우 등) 잘라내는 영역이 어긋난다. 그래서
// 화면 크기와 무관한 비율(%)로 크롭 영역을 받아서, 이미지의 실제 원본 픽셀 크기에 직접
// 적용한다.
export async function cropImageByPercent(
  imageSrc: string,
  percentCrop: { x: number; y: number; width: number; height: number },
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const cropX = (percentCrop.x / 100) * image.naturalWidth;
  const cropY = (percentCrop.y / 100) * image.naturalHeight;
  const cropWidth = (percentCrop.width / 100) * image.naturalWidth;
  const cropHeight = (percentCrop.height / 100) * image.naturalHeight;

  const canvas = document.createElement("canvas");
  canvas.width = cropWidth;
  canvas.height = cropHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지 처리에 실패했습니다.");
  ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
  return canvasToBlob(canvas);
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("이미지 처리에 실패했습니다."))),
      "image/jpeg",
      0.9,
    );
  });
}
