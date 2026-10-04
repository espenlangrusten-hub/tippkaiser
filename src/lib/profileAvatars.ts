import { BASE_PATH } from "@/lib/site";

export const AVATAR_UNLOCK_POINTS = 2000;

export type ProfileAvatarOption = {
  id: number;
  label: string;
  src: string;
};

export const PROFILE_AVATARS: ProfileAvatarOption[] = [
  { id: 1, label: "Avatar 1", src: BASE_PATH + "/avatars/avatar-1.webp" },
  { id: 2, label: "Avatar 2", src: BASE_PATH + "/avatars/avatar-2.webp" },
  { id: 3, label: "Avatar 3", src: BASE_PATH + "/avatars/avatar-3.webp" },
  { id: 4, label: "Avatar 4", src: BASE_PATH + "/avatars/avatar-4.webp" },
  { id: 5, label: "Avatar 5", src: BASE_PATH + "/avatars/avatar-5.webp" },
  { id: 6, label: "Avatar 6", src: BASE_PATH + "/avatars/avatar-6.webp" },
  { id: 7, label: "Karikatur 1", src: BASE_PATH + "/profile/avatar-7.webp" },
  { id: 8, label: "Karikatur 2", src: BASE_PATH + "/profile/avatar-8.webp" },
  { id: 9, label: "Karikatur 3", src: BASE_PATH + "/profile/avatar-9.webp" },
];

export function avatarSrc(id: number | null | undefined) {
  return PROFILE_AVATARS.find((avatar) => avatar.id === id)?.src ?? null;
}
