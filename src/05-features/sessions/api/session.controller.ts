import { Request, Response, NextFunction } from 'express';
import { pairDeviceProcess } from '@02-processes/sessions/pairing.process';


export const pairDevice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pairingToken } = req.params;
    const userId = req.user.id; // 인증 미들웨어(Shared)에서 받은 유저 ID

    const session = await pairDeviceProcess(pairingToken, userId);

    res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    next(error); // 전역 에러 핸들러로 전달
  }
};