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
  public static emitLiveEvent(event: string = 'eeg-live', data: any): void {
    if (this.io) {
      this.io.emit(event, data);
    }
  }
}
