import { Transform } from 'class-transformer';

/** Обрезает пробелы в конце строки при разборе тела запроса. */
export const TrimEnd = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trimEnd() : value));
