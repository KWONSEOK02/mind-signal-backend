/* eslint-disable camelcase */
import { z } from 'zod';

/**
 * Similarity 스키마 공통 필드 정의
 * 모든 알고리즘 스키마의 base
 */
export const similarityBaseSchema = z.object({
  algorithm: z.string(),
  similarity_score: z.number().min(0).max(1), // DE API snake_case 키 그대로 유지함
});

export type SimilarityBase = z.infer<typeof similarityBaseSchema>;
