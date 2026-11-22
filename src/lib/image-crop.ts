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

// 회전한 사진 안에 빈 곳 없이 들어가는 가장 큰 가로·세로 직사각형의 크기.
// 회전 결과를 이 크기로만 남기면, 다음 자르기 단계에서 사진 밖(빈 모서리)을 고를 수 없다.
export function largestInscribedSize(width: number, height: number, rotation: number) {
  const quarter = ((Math.round(rotation) % 360) + 360) % 90 === 0;
  if (quarter) {
    const sideways = Math.abs(Math.round(rotation / 90)) % 2 === 1;
    return sideways ? { width: height, height: width } : { width, height };
  }
  const rad = getRadianAngle(rotation);
  const sin = Math.abs(Math.sin(rad)), cos = Math.abs(Math.cos(rad));
  const widthIsLonger = width >= height;
  const long = widthIsLonger ? width : height, short = widthIsLonger ? height : width;
  if (short <= 2 * sin * cos * long || Math.abs(sin - cos) < 1e-10) {
    // 긴 변 쪽 모서리가 먼저 닿는 경우: 짧은 변의 절반이 직사각형의 반대각선 길이를 정한다.
    const x = short / 2;
    return widthIsLonger ? { width: x / sin, height: x / cos } : { width: x / cos, height: x / sin };
  }
  const cos2 = cos * cos - sin * sin;
  return { width: (width * cos - height * sin) / cos2, height: (height * cos - width * sin) / cos2 };
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

  // 원본 픽셀 크기 기준으로, 회전 후 빈 모서리를 뺀 안쪽 영역만 캔버스에 담는다.
  const inner = largestInscribedSize(image.naturalWidth, image.naturalHeight, rotation);
  const width = Math.max(1, Math.floor(inner.width));
  const height = Math.max(1, Math.floor(inner.height));
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

  // 휴대폰 원본(수 MB)을 그대로 두면 기기 저장소와 백업 파일이 빠르게 커지므로,
  // 목록·상세에서 쓰기에 충분한 크기로 줄여서 저장한다. 원본 픽셀 기준으로만 계산한다.
  const scale = Math.min(1, MAX_PHOTO_EDGE / Math.max(cropWidth, cropHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(cropWidth * scale));
  canvas.height = Math.max(1, Math.round(cropHeight * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지 처리에 실패했습니다.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
  return canvasToBlob(canvas, 0.85);
}

export const MAX_PHOTO_EDGE = 1600;

function canvasToBlob(canvas: HTMLCanvasElement, quality = 0.9): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("이미지 처리에 실패했습니다."))),
      "image/jpeg",
      quality,
    );
  });
}
