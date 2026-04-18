/**
 * Similarity 스키마 레지스트리
 * 팀원이 새 알고리즘 추가 시: 새 스키마 파일 생성 후 이 map에 등록함
 */
import { z } from 'zod';
import { cosinePearsonFAASchema } from './cosine_pearson_faa.schema';

export { similarityBaseSchema } from './_base';
export { cosinePearsonFAASchema } from './cosine_pearson_faa.schema';
export type { SimilarityBase } from './_base';
export type { CosinePearsonFAAResult } from './cosine_pearson_faa.schema';

/** algorithm 이름 → Zod 스키마 매핑 (새 알고리즘 등록 위치) */
export const similaritySchemaRegistry: Record<string, z.ZodTypeAny> = {
  cosine_pearson_faa: cosinePearsonFAASchema,
  default: cosinePearsonFAASchema,
};

/**
 * algorithm 이름으로 스키마를 조회함
 * 등록되지 않은 이름이면 undefined 반환
 */
export function getSimilaritySchema(
  algorithm: string
): z.ZodTypeAny | undefined {
  return similaritySchemaRegistry[algorithm];
}
