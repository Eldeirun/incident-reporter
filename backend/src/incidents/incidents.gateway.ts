import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class IncidentsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  broadcastNewIncident(incident: any) {
    this.server.emit('newIncident', incident);
  }

  broadcastRemoveIncident(incidentId: number) {
    this.server.emit('removeIncident', incidentId);
  }

  broadcastResolveVote(incidentId: number, resolveCount: number) {
    this.server.emit('resolveVote', { incidentId, resolveCount });
  }
  broadcastReportCount(incidentId: number, reportCount: number) {
    this.server.emit('reportCount', { incidentId, reportCount });
  }
}
