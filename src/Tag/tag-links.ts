import { HttpException, HttpStatus } from '@nestjs/common';

export type TagLink = { tag_id: number, tag_name: string };

const ownerColumn: Record<string, string> = {
  user_tag: 'user_id',
  event_tag: 'event_id',
  work_shift_tag: 'work_shift_id',
};

type QueryRepo = { query: (sql: string, params?: unknown[]) => Promise<any[]> };

export const loadTagLinks = async (
  repository: QueryRepo,
  table: keyof typeof ownerColumn,
  ownerIds: number[],
): Promise<Map<number, TagLink[]>> => {
  const grouped = new Map<number, TagLink[]>();
  const column = ownerColumn[table];
  const ids = ownerIds.filter((id) => Number.isInteger(id) && id > 0);
  if (!ids.length) {
    return grouped;
  }

  const rows: { owner_id: number, tag_id: number, tag_name: string }[] = await repository.query(
    `SELECT link.${column} AS owner_id, t.id AS tag_id, t.tag_name
     FROM ${table} link
     JOIN tag t ON t.id = link.tag_id
     WHERE link.${column} = ANY($1::int[])
     ORDER BY t.tag_name ASC`,
    [ids],
  );

  rows.forEach((row) => {
    const ownerId = Number(row.owner_id);
    const list = grouped.get(ownerId) || [];
    list.push({ tag_id: Number(row.tag_id), tag_name: row.tag_name });
    grouped.set(ownerId, list);
  });
  return grouped;
};

export const replaceTagLinks = async (
  repository: QueryRepo,
  table: keyof typeof ownerColumn,
  ownerId: number,
  tagIds: number[],
): Promise<void> => {
  const column = ownerColumn[table];
  const ids = [...new Set((tagIds || []).map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0))].slice(0, 30);
  if (ids.length) {
    const found: { id: number }[] = await repository.query(
      `SELECT id FROM tag WHERE id = ANY($1::int[])`,
      [ids],
    );
    if (found.length !== ids.length) {
      throw new HttpException('Указан несуществующий тег', HttpStatus.BAD_REQUEST);
    }
  }

  await repository.query(`DELETE FROM ${table} WHERE ${column} = $1`, [ownerId]);
  if (ids.length) {
    await repository.query(
      `INSERT INTO ${table} (${column}, tag_id) SELECT $1, tag_id FROM unnest($2::int[]) AS tag_id`,
      [ownerId, ids],
    );
  }
};
