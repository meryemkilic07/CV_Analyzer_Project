# Models

Bu klasör, projede kullanılan NLP ve yapay zeka modellerine ait konfigürasyon ve ön tanımlı ayar dosyalarını içerir.

## Örnek içerikler:
- `model_config.json`: Kullanılacak embedding modeli ve tokenizer ayarları
- Önceden indirilen embedding dosyaları (eğer offline kullanılacaksa)
- LangChain, Sentence-BERT veya spaCy model tanımlamaları

**Not:** Büyük modeller bu klasöre konmaz, genellikle Hugging Face üzerinden dinamik olarak yüklenir.
