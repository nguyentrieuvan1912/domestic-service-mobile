import { useEffect, useState } from 'react';
import { PermissionsAndroid, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { AudioSession, LiveKitRoom, VideoTrack, isTrackReference, registerGlobals, useConnectionState, useLocalParticipant, useParticipants, useTracks } from '@livekit/react-native';
import { Track, ConnectionState } from 'livekit-client';
registerGlobals();
export default function BookingCallRoom({ serverUrl, token, onEnd }: { serverUrl: string; token: string; onEnd: () => void }) {
  const [ready, setReady] = useState(false), [error, setError] = useState('');
  useEffect(() => { let alive = true; void (async () => {
    if (Platform.OS === 'android' && await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO) !== PermissionsAndroid.RESULTS.GRANTED) throw new Error('Cần quyền micro để nói chuyện.');
    await AudioSession.startAudioSession(); if (alive) setReady(true);
  })().catch(cause => { if (alive) setError(cause instanceof Error ? cause.message : 'Chưa bật được âm thanh.'); });
  return () => { alive = false; void AudioSession.stopAudioSession(); }; }, []);
  return <View style={s.screen}>{!!error && <Text style={s.error}>{error}</Text>}{ready ? <LiveKitRoom serverUrl={serverUrl} token={token} connect audio video={false} onError={cause => setError(cause.message)} onDisconnected={() => setError('Đã ngắt kết nối phòng gọi.')}><Controls onEnd={onEnd} /></LiveKitRoom> : <Pressable onPress={onEnd} style={s.end}><Text style={s.white}>Kết thúc</Text></Pressable>}</View>;
}
function Controls({ onEnd }: { onEnd: () => void }) {
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant(), participants = useParticipants(), connection = useConnectionState(), tracks = useTracks([Track.Source.Camera]);
  const [error, setError] = useState('');
  const act = async (work: () => Promise<unknown>) => { try { await work(); setError(''); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Chưa đổi được thiết bị.'); } };
  return <View style={s.screen}><Text style={s.status}>{connection === ConnectionState.Connected ? participants.length > 1 ? 'Đã kết nối với người bên kia' : 'Đã vào phòng · Đang chờ người bên kia' : connection === ConnectionState.Reconnecting ? 'Đang kết nối lại…' : 'Đang kết nối LiveKit…'}</Text>
    {tracks.filter(isTrackReference).map(track => <VideoTrack key={track.participant.identity + track.source} trackRef={track} style={s.video} />)}
    {!!error && <Text style={s.error}>{error}</Text>}
    <View style={s.controls}><Pressable style={s.button} onPress={() => void act(() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled))}><Text style={s.white}>{isMicrophoneEnabled ? 'Tắt micro' : 'Bật micro'}</Text></Pressable><Pressable style={s.button} onPress={() => void act(async () => { if (!isCameraEnabled && Platform.OS === 'android' && await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA) !== PermissionsAndroid.RESULTS.GRANTED) throw new Error('Cần quyền camera để bật video.'); await localParticipant.setCameraEnabled(!isCameraEnabled); })}><Text style={s.white}>{isCameraEnabled ? 'Tắt video' : 'Bật video'}</Text></Pressable><Pressable style={s.end} onPress={onEnd}><Text style={s.white}>Kết thúc</Text></Pressable></View>
  </View>;
}
const s = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#102620', gap: 12, padding: 12 }, status: { color: '#D1FAE5', textAlign: 'center', fontSize: 15 }, controls: { marginTop: 'auto', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }, button: { padding: 14, minHeight: 44, borderRadius: 10, backgroundColor: '#265C4D' }, end: { padding: 14, minHeight: 44, borderRadius: 10, backgroundColor: '#B91C1C', alignItems: 'center' }, white: { color: '#fff', fontWeight: '700' }, error: { color: '#FECACA', padding: 10 }, video: { width: '100%', height: 200, borderRadius: 12 } });
