import { AppError } from '@07-shared/errors';
import { config } from '@07-shared/config/config';
import { engineRegistryService } from './engine-registry.service';

/** snake_case 키를 camelCase로 재귀 변환함 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/** 객체의 모든 키를 snake_case → camelCase로 재귀 변환함 */
function toCamelCaseKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCaseKeys);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([key, val]) => [
        snakeToCamel(key),
        toCamelCaseKeys(val),
      ])
    );
  }
  return obj;
}

export const engineProxyService = {
  /** 등록된 파이썬 엔진으로 분석 요청을 프록시함 */
  async analyze(
    groupId: string,
    subjectIndices: number[],
    includeMarkdown: boolean
  ): Promise<Record<string, unknown>> {
    const engineUrl = engineRegistryService.getEngineUrl();

    const response = await fetch(`${engineUrl}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Engine-Secret': config.dataEngine.secretKey,
      },
      body: JSON.stringify({
        ['group_id']: groupId,
        ['subject_indices']: subjectIndices,
        ['include_markdown']: includeMarkdown,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new AppError(
        `파이썬 엔진 분석 실패: ${response.status} ${errorText}`,
        response.status
      );
    }

    const data = await response.json();
    return toCamelCaseKeys(data) as Record<string, unknown>;
  },

  /** 등록된 파이썬 엔진으로 전체 파이프라인 분석 요청을 프록시함 */
  async analyzePipeline(
    groupId: string,
    subjectIndices: number[],
    params?: {
      stimulusDurationSec?: number;
      windowSizeSec?: number;
      nStimuli?: number;
      baselineDurationSec?: number;
      bandCols?: string[];
    },
    satisfactionScores?: Record<number, number>,
    includeMarkdown?: boolean
  ): Promise<Record<string, unknown>> {
    const engineUrl = engineRegistryService.getEngineUrl();

    const response = await fetch(`${engineUrl}/api/analyze/pipeline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Engine-Secret': config.dataEngine.secretKey,
      },
      body: JSON.stringify({
        ['group_id']: groupId,
        ['subject_indices']: subjectIndices,
        ['params']: params
          ? {
              ['stimulus_duration_sec']: params.stimulusDurationSec,
              ['window_size_sec']: params.windowSizeSec,
              ['n_stimuli']: params.nStimuli,
              ['baseline_duration_sec']: params.baselineDurationSec,
              ['band_cols']: params.bandCols,
            }
          : undefined,
        ['satisfaction_scores']: satisfactionScores,
        ['include_markdown']: includeMarkdown ?? false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new AppError(
        `파이썬 엔진 파이프라인 분석 실패: ${response.status} ${errorText}`,
        response.status
      );
    }

    const data = await response.json();
    return toCamelCaseKeys(data) as Record<string, unknown>;
  },
};
