export class Plugin {}

export function confirm(
  _title: string,
  _message: string,
  _onConfirm: () => void,
  onCancel: () => void
): void {
  onCancel();
}

export async function fetchPost() {
  return { data: null };
}
