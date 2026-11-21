// All public traffic cameras listed on https://dedtuv.erdenet.mn/live (snapshot 2026-11-20).
// Only some of them report vehicle counts through the live feed; the rest are shown as "no count".
export interface CameraInfo { id: string; name: string; lat: number; lng: number }

export const CAMERAS: CameraInfo[] = [
  { id: "e837f67e-9797-48c6-8a2f-27aac5cb4101", name: "Булган гарах зам", lat: 48.987765, lng: 104.007225 },
  { id: "7fda23a6-93b3-4b72-aa62-e2b5b11789e2", name: "26 цэцэрлэг баруун уулзвар", lat: 49.014899, lng: 104.016146 },
  { id: "caf033e6-69b8-4fab-ae28-76e0dc2ede75", name: "Дэнжийн зам", lat: 49.018441, lng: 104.04233 },
  { id: "f8827e02-3363-4c46-bf5a-17f9e6b806ac", name: "A1001 зам", lat: 49.02356, lng: 104.05345 },
  { id: "5b0f44b1-95d8-43de-84e3-48ebdb151b11", name: "Жаст ШТС уулзавр", lat: 49.013118, lng: 104.019445 },
  { id: "b1fce1fb-137c-4f17-80c8-a7c92f6092e1", name: "Тосгоны уулзвар", lat: 49.036788, lng: 104.092321 },
  { id: "dc30df86-dc88-4e5e-8d1a-0ccfe3d0a513", name: "9 Эрдэнэ уулзвар", lat: 49.027802, lng: 104.06265 },
  { id: "bbd9840f-d7c9-410e-b150-73734bc15ce7", name: "Хуучин консулын уулзвар", lat: 49.030486, lng: 104.042974 },
  { id: "90677cea-e2eb-4917-9265-7b3a799d5a80", name: "Нийгмийн даатгалын ард", lat: 49.032234, lng: 104.04351 },
  { id: "4fef6cc8-fe07-4717-bb68-dab2cea3f9e9", name: "19-р цэцэрлэг уулзвар", lat: 49.031362, lng: 104.046117 },
  { id: "e9104dd4-b39c-45b6-a623-ea5a472c245d", name: "Төгөл гарден зүүн", lat: 49.031122, lng: 104.039921 },
  { id: "46c5b8ff-0343-4344-82c4-7696701268b8", name: "Хойд дугуй уулзвар", lat: 49.035164, lng: 104.05117 },
  { id: "55a99b64-5b9f-4917-ae6f-00fd75ee925d", name: "Аюулгүйн тойрог", lat: 49.024468, lng: 104.04675 },
  { id: "8041df28-0cea-43bb-84fc-684019f40250", name: "Орхонмалл хойд", lat: 49.029308, lng: 104.035925 },
  { id: "9c944312-c71e-4e54-b448-bdf545901618", name: "Вокзалын арын зам", lat: 49.061361, lng: 104.164649 },
  { id: "7894e123-3a93-4f12-ad75-5c4397913ccc", name: "Хивс урд 3 зам", lat: 49.033092, lng: 104.083142 },
  { id: "7c2184a2-c6b5-4b14-a605-25011e895b86", name: "Булганын зам", lat: 48.990574, lng: 104.007043 },
  { id: "90bf6f24-14d3-48fc-a766-7b4547129d3c", name: "Их залуу самбар", lat: 49.001569, lng: 104.005744 },
  { id: "a71743fa-3ae0-4309-9320-63f354a3279e", name: "ТИП ТОП уулзвар", lat: 49.023412, lng: 104.03085 },
  { id: "b2bdd07f-e9b7-4c56-8474-a5dfba5ae574", name: "Баян уулзвар PTZ", lat: 49.027552, lng: 104.044765 },
  { id: "dbdfce53-4d0b-40bd-81cc-cd816a9af428", name: "100 Айл урд зам", lat: 49.024327, lng: 104.060934 },
  { id: "63f83829-74fa-4384-a2b0-05feab52991e", name: "Уртцагаан төв зам", lat: 49.029012, lng: 104.049416 },
  { id: "d8d17afc-273a-400a-863d-23b9359f6bf3", name: "6-10 Уулзвар", lat: 49.022163, lng: 104.040468 },
  { id: "d74bf66c-389f-40b1-aa75-d261263a6d47", name: "Сүмийн уулзвар", lat: 49.025519, lng: 104.038242 },
  { id: "fcd310c2-bd59-4c63-a077-e5523e26b6df", name: "Холбооны уулзвар PTZ", lat: 49.030651, lng: 104.055558 },
  { id: "5b7d2de0-bef8-4e85-b0eb-8e89077afaba", name: "Барилгачин уулзвар PTZ", lat: 49.031974, lng: 104.060043 },
];
