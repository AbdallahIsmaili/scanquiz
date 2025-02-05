declare module "jspdf" {
  interface jsPDF {
    splitTextToSize(text: string, maxWidth: number): string[];
    setFillColor(color: number | string | number[]): void;
  }
}
