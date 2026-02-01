export class CreateWorkDto {
  title: string;
  iswc?: string;
  writers: {
    name: string;
    ipi?: string;
    performanceSplit: number;
    mechanicalSplit: number;
  }[];
}
