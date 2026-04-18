/* eslint-disable camelcase */
import { z } from 'zod';
import { similarityBaseSchema } from './_base';

/**
 * cosine_pearson_faa 알고리즘 유사도 결과 스키마
 * DE의 CosinePearsonFAAStrategy.compute() 출력 형식과 일치함
 */
export const cosinePearsonFAASchema = similarityBaseSchema.extend({
  overall_cosine: z.number(),
  band_ratio_diff: z.record(z.string(), z.number()),
  faa_absolute_diff: z.number().nullable(),
});

export type CosinePearsonFAAResult = z.infer<typeof cosinePearsonFAASchema>;
