import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

/**
 * Socket.io 서버 관리 유틸리티
 */
export class SocketService {
  private static io: Server;

  /**
   * HTTP 서버와 Socket.io를 연결하여 초기화
   * @param {HttpServer} server - Express 서버 객체
   */
  public static init(server: HttpServer): Server {
    this.io = new Server(server, {
      cors: {
        origin: '*', // 보안을 위해 운영 환경에서는 특정 도메인으로 제한 필요
        methods: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket: Socket) => {
      console.log(`New client connected: ${socket.id}`);

      // 신규 — room join 핸들러 + ack 반환 (Phase 16 plan-review H-2 + v2 Medium 반영)
      socket.on(
        'join-room',
        (
          groupId: string,
          ack?: (response: {
            ok: boolean;
            groupId?: string;
            error?: string;
          }) => void
        ) => {
          if (typeof groupId !== 'string' || groupId.length === 0) {
            ack?.({ ok: false, error: 'invalid groupId' });
            return;
          }
          socket.join(groupId);
          console.log(`Socket ${socket.id} joined room ${groupId}`);
          ack?.({ ok: true, groupId });
        }
      );

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });

    return this.io;
  }

  /**
   * 초기화된 Socket.io 인스턴스 반환
   * @throws {Error} 초기화되지 않았을 경우 에러 발생
   */
  public static getIO(): Server {
    if (!this.io) {
      throw new Error('Socket.io has not been initialized');
    }
    return this.io;
  }

  /**
   * 실시간 EEG 데이터를 프론트엔드로 전송
   * @param {string} event - 이벤트 명 (기본값: 'eeg-live')
   * @param {any} data - 전송할 뇌파 데이터 객체
   */
  public static emitLiveEvent(event: string = 'eeg-live', data: unknown): void {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  /**
   * 특정 groupId room에 이벤트 브로드캐스트 (Phase 16 DUAL_2PC 전용)
   * @param {string} groupId - 대상 room 식별자
   * @param {string} event - 이벤트 명
   * @param {unknown} data - 전송할 데이터 객체
   */
  public static emitToGroup(
    groupId: string,
    event: string,
    data: unknown
  ): void {
    if (this.io) {
      this.io.to(groupId).emit(event, data);
    }
  }
}
