import { createClient, RedisClientType } from 'redis';
import { config } from '@07-shared/config/config';

class RedisService {
  private static instance: RedisService;
  public client: RedisClientType;

  private constructor() {
    // 2. process.env 대신 config 객체 사용
    const { host, port } = config.redis;

    this.client = createClient({
      url: `redis://${host}:${port}`,
    });

    this.client.on('error', (err) => console.error('Redis Client Error', err));
    this.client.on('connect', () => console.log('Redis Client Connected'));
  }

  /**
   * RedisService 인스턴스를 반환 (싱글톤)
   * @returns {RedisService}
   */
  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  /**
   * Redis 서버에 연결 시도
   */
  public async connect(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  /**
   * Redis 연결 종료
   */
  public async disconnect(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.disconnect();
    }
  }
}

export const redisService = RedisService.getInstance();
