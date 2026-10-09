"""只读输出本次配音集成的非敏感状态。"""
import json
from pathlib import Path

storage = Path('/home/pi5/home-assistant/config/.storage')
pipelines = json.loads((storage / 'assist_pipeline.pipelines').read_text())['data']
entities = json.loads((storage / 'core.entity_registry').read_text())['data']['entities']
print(json.dumps({
    'preferred': pipelines['preferred_item'],
    'pipelines': [{key: item.get(key) for key in ('id', 'name', 'language', 'tts_engine', 'tts_voice', 'stt_engine')} for item in pipelines['items']],
    'tts_entities': [item['entity_id'] for item in entities if item.get('platform') == 'tts_voice_api'],
}, ensure_ascii=False))
