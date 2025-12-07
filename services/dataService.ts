import { NewsEntry, PostStatus, SourceRegion, ProcessedArticle } from '../types';

const MOCK_ARTICLES: ProcessedArticle[] = [
    {
      "original_url": "https://www.ntvspor.net/foto-galeri/galatasaray-sampiyonlar-liginde-yenildi-ve-tumer-metin-hemen-derbi-bombasini-patlatti-413424",
      "title": "Galatasaray, Şampiyonlar Ligi'nde yenildi ve Tümer Metin hemen derbi bombasını patlattı",
      "summary": "Yorumcu Tümer Metin, Galatasaray'ın 26 Kasım 2025'te Union Saint-Gilloise'ya 1-0 mağlup olduğu Şampiyonlar Ligi maçını değerlendirdi. Metin, 1 Aralık'ta Fenerbahçe ile oynanacak derbi öncesinde, Galatasaray'ın mevcut eksikleri göz önüne alındığında, teknik direktör Okan Buruk'a bir puan teklif edilse kabul edeceğini belirtti. Metin, \"Bütün eksikleri koy senin Fenerbahçe'yi yeneceğin garanti değil, bütün eksiklerin tam olsa da. Derbi başka bir şey. Bence kabul yani şu anda\" ifadelerini kullandı.",
      "source": "www.ntvspor.net",
      "published_date": "2025-11-26T05:18:38.073000+00:00",
      "categories": [
        "match_results",
        "team_rivalry",
        "performance_analysis",
        "european_competitions"
      ],
      "key_entities": {
        "competitions": [
          "Şampiyonlar Ligi"
        ],
        "locations": [],
        "players": [
          "Tümer Metin",
          "Okan Buruk"
        ],
        "teams": [
          "Galatasaray",
          "Fenerbahçe",
          "Union Saint-Gilloise"
        ]
      },
      "content_quality": "high",
      "confidence": 0.9,
      "language": "turkish"
    },
    {
      "original_url": "https://www.ntvspor.net/futbol/galatasaray-dev-derbinin-hazirliklarina-basladi-413446",
      "title": "Galatasaray dev derbinin hazırlıklarına başladı",
      "summary": "Galatasaray, Trendyol Süper Lig'in 14. haftasında Fenerbahçe ile oynayacağı derbi maçının hazırlıklarına başladı. Kulüpten yapılan açıklamaya göre, Kemerburgaz Metin Oktay Tesisleri'nde teknik direktör Okan Buruk yönetiminde gerçekleştirilen antrenman, dinamik ısınma, 5'e 2 pas çalışması ve çift kale maç ile tamamlandı. Sarı-kırmızılı ekip, hazırlıklarını 28 Kasım Cuma günü yapacağı idmanla sürdürecek.",
      "source": "www.ntvspor.net",
      "published_date": "2025-11-26T13:02:09.400000+00:00",
      "categories": [
        "team_rivalry",
        "squad_changes"
      ],
      "key_entities": {
        "competitions": [
          "Trendyol Süper Lig"
        ],
        "locations": [
          "Kemerburgaz Metin Oktay Tesisleri"
        ],
        "players": [
          "Okan Buruk"
        ],
        "teams": [
          "Galatasaray",
          "Fenerbahçe"
        ]
      },
      "content_quality": "high",
      "confidence": 0.9,
      "language": "turkish"
    },
    {
      "original_url": "https://www.ntvspor.net/futbol/fenerbahce-evindeki-avrupa-maclarinda-rakiplerine-goz-actirmiyor-413440",
      "title": "Fenerbahçe evindeki Avrupa maçlarında rakiplerine göz açtırmıyor",
      "summary": "UEFA Avrupa Ligi'nde Ferencvaros'u konuk edecek olan Fenerbahçe, Avrupa kupalarında Kadıköy'deki başarılı sonuçlarıyla dikkat çekiyor. Sarı-lacivertliler, sahasında oynadığı son 26 Avrupa maçında sadece 3 kez mağlup oldu; bu maçların 18'ini kazandı ve 5'inde berabere kaldı. Bu süreçte takım, Jorge Jesus, İsmail Kartal, Jose Mourinho ve Domenico Tedesco gibi dört farklı teknik direktörle çalıştı. Kulübün 13 Eylül 1959'dan bu yana Avrupa kupalarında evinde oynadığı toplam 146 maçta 76 galibiyet, 32 beraberlik ve 38 yenilgisi bulunuyor.",
      "source": "www.ntvspor.net",
      "published_date": "2025-11-26T11:17:25.836000+00:00",
      "categories": [
        "performance_analysis",
        "european_competitions"
      ],
      "key_entities": {
        "competitions": [
          "UEFA Avrupa Ligi"
        ],
        "locations": [
          "Kadıköy"
        ],
        "players": [
          "Jorge Jesus",
          "İsmail Kartal",
          "Jose Mourinho",
          "Domenico Tedesco"
        ],
        "teams": [
          "Fenerbahçe",
          "Ferencvaros",
          "Dinamo Kiev",
          "Sevilla",
          "Olympiakos",
          "Rangers",
          "Benfica",
          "Feyenoord"
        ]
      },
      "content_quality": "high",
      "confidence": 0.9,
      "language": "turkish"
    },
    {
      "original_url": "https://www.ntvspor.net/basketbol/fenerbahce-beko-galibiyet-serisini-surdurdu-413412",
      "title": "Fenerbahçe Beko galibiyet serisini sürdürdü",
      "summary": "Basketbol Avrupa Ligi'nin 13. haftasında Fenerbahçe Beko, İtalyan temsilcisi Virtus Bologna'yı 66-64 mağlup ederek organizasyondaki 8. galibiyetini aldı. Maçın son anlarına 64-64 berabere girilirken, bitime 45 saniye kala Melli'nin basketiyle Fenerbahçe galibiyete ulaştı. Maç öncesi, Türkiye Basketbol Süper Ligi'nde 5 bin sayı barajını aşan kaptan Melih Mahmutoğlu'na \"5000 numaralı\" forma hediye edildi. Ayrıca, her iki takım da eski Fenerbahçeli Achille Polonara'ya destek için \"Forza Achi\" pankartıyla sahaya çıktı.",
      "source": "www.ntvspor.net",
      "published_date": "2025-11-25T20:20:18.619000+00:00",
      "categories": [
        "match_results",
        "european_competitions",
        "basketball"
      ],
      "key_entities": {
        "competitions": [
          "Basketbol Avrupa Ligi",
          "Türkiye Basketbol Süper Ligi"
        ],
        "locations": [],
        "players": [
          "Melih Mahmutoğlu",
          "Achille Polonara",
          "Vildoza",
          "Tarık Biberovic",
          "Baldwin",
          "Melli"
        ],
        "teams": [
          "Fenerbahçe Beko",
          "Virtus Bologna"
        ]
      },
      "content_quality": "high",
      "confidence": 0.9,
      "language": "turkish"
    },
    {
      "original_url": "https://www.ntvspor.net/foto-galeri/dunyaca-unlu-gazeteci-fenerbahce-icin-lewandowski-bombasini-patlatti-413390",
      "title": "Dünyaca ünlü gazeteci, Fenerbahçe için Lewandowski bombasını patlattı",
      "summary": "Sky Sport'tan gazeteci Florian Plettenberg'in haberine göre, Fenerbahçe'nin Robert Lewandowski'ye somut bir ilgisi oldu ancak Polonyalı golcü bu teklifi reddetti. Haberde, Lewandowski'nin en azından sezon sonuna kadar Barcelona'da kalmak istediği ve ara transfer döneminde bir ayrılık düşünmediği belirtildi. Sezon sonunda sözleşmesi bitecek olan Lewandowski'nin +1 yıl opsiyonu bulunuyor.",
      "source": "www.ntvspor.net",
      "published_date": "2025-11-25T13:17:53.189000+00:00",
      "categories": [
        "transfers_rumors",
        "departures",
        "transfers_interest"
      ],
      "key_entities": {
        "competitions": [],
        "locations": [],
        "players": [
          "Robert Lewandowski",
          "Florian Plettenberg"
        ],
        "teams": [
          "Fenerbahçe",
          "Barcelona"
        ]
      },
      "content_quality": "high",
      "confidence": 0.9,
      "language": "turkish"
    },
    {
      "original_url": "https://www.ntvspor.net/foto-galeri/galatasaray-bedava-stoper-icin-pusuda-nino-kapiyi-acti-413275",
      "title": "Galatasaray bedava stoper için pusuda: Nino kapıyı açtı",
      "summary": "Brezilya basınından RTI Esporte'nin haberine göre, Galatasaray ve Yunanistan'dan Olympiakos, Rusya'nın Zenit takımında forma giyen Brezilyalı stoper Nino'nun durumunu yakından takip ediyor. İki kulübün de, 28 yaşındaki oyuncunun idari sebeplerle serbest kalması durumunda transfer için girişimlere başlayacağı iddia edildi. Brezilya'dan Fluminense ve Palmeiras'ın da ilgilendiği Nino'nun, kariyerine Avrupa'da devam etmeyi tercih ettiği ve bu nedenle ülkesinden gelen teklifleri şu an için değerlendirmediği belirtildi. Nino'nun Zenit ile 30 Haziran 2028'e kadar sözleşmesi bulunuyor.",
      "source": "www.ntvspor.net",
      "published_date": "2025-11-23T12:33:08.007000+00:00",
      "categories": [
        "transfers_rumors",
        "transfers_interest"
      ],
      "key_entities": {
        "competitions": [],
        "locations": [
          "Brezilya",
          "Yunanistan",
          "Rusya"
        ],
        "players": [
          "Nino"
        ],
        "teams": [
          "Galatasaray",
          "Zenit",
          "Olympiakos",
          "Fluminense",
          "Palmeiras"
        ]
      },
      "content_quality": "high",
      "confidence": 0.9,
      "language": "turkish"
    },
    {
      "original_url": "https://www.ntvspor.net/foto-galeri/ve-sorloth-fenerbahcede-ilk-kez-resmen-dillendirildi-her-turlu-surprize-acik-olun-413272",
      "title": "Ve Sörloth Fenerbahçe'de ilk kez resmen dillendirildi: \"Her türlü sürprize açık olun\"",
      "summary": "Fenerbahçe Futbol Şube Sorumlusu Ertan Torunoğulları, Fanatik'e yaptığı açıklamada, forvet transferi arayışları kapsamında Alexander Sörloth isminin gündemde olduğunu ilk kez resmen dile getirdi. Torunoğulları, \"Transferde Sörloth ve başka isimler gündeme geliyor. Takviye için çalışıyoruz. Taraftarlarımız transferde her türlü sürprize açık olsun. Elimizden ne geliyorsa fazlasını yapacağız\" diyerek, kulübün tüm kupalara talip olduğunu belirtti.",
      "source": "www.ntvspor.net",
      "published_date": "2025-11-23T10:40:41.902000+00:00",
      "categories": [
        "transfers_interest",
        "transfers_rumors"
      ],
      "key_entities": {
        "competitions": [],
        "locations": [],
        "players": [
          "Alexander Sörloth",
          "Ertan Torunoğulları"
        ],
        "teams": [
          "Fenerbahçe"
        ]
      },
      "content_quality": "high",
      "confidence": 0.9,
      "language": "turkish"
    },
    {
      "original_url": "https://www.ntvspor.net/foto-galeri/tedesco-istedi-fenerbahce-samsunsporun-yildizinin-pesine-dustu-ligi-ve-avrupayi-salliyor-413261",
      "title": "Tedesco istedi, Fenerbahçe Samsunspor'un yıldızının peşine düştü! Ligi ve Avrupa'yı sallıyor",
      "summary": "Sabah Gazetesi'nin haberine göre, Fenerbahçe Teknik Direktörü Domenico Tedesco'nun raporu doğrultusunda Samsunspor'un kanat oyuncusu Anthony Musaba'yı transfer radarına aldı. Tedesco'nun \"Şartlarına bakalım\" dediği 24 yaşındaki futbolcu için Fenerbahçe yönetiminin, şartların uygun olması halinde devre arasında Samsunspor ile görüşmelere başlayacağı ve öncelikle kiralama teklifi yapacağı iddia edildi. Musaba, bu sezon Süper Lig'de 10 maçta 2 gol ve 2 asist, Konferans Ligi'nde ise 3 maçta 2 gol ve 1 asistle performans sergiliyor.",
      "source": "www.ntvspor.net",
      "published_date": "2025-11-23T07:14:20.905000+00:00",
      "categories": [
        "transfers_rumors",
        "transfers_interest"
      ],
      "key_entities": {
        "competitions": [
          "Süper Lig",
          "Konferans Ligi"
        ],
        "locations": [],
        "players": [
          "Anthony Musaba",
          "Domenico Tedesco"
        ],
        "teams": [
          "Fenerbahçe",
          "Samsunspor",
          "Sheffield Wednesday"
        ]
      },
      "content_quality": "high",
      "confidence": 0.9,
      "language": "turkish"
    },
    {
      "original_url": "https://www.ntvspor.net/foto-galeri/ridvan-dilmenden-galatasarayin-yildizi-icin-flas-transfer-iddiasi-bugun-izleseler-20-milyon-euro-daha-verirler-413243",
      "title": "Rıdvan Dilmen'den Galatasaray'ın yıldızı için flaş transfer iddiası: \"Bugün izleseler 20 milyon euro daha verirler\"",
      "summary": "Galatasaray'ın Gençlerbirliği'ni 3-2 yendiği maç sonrası yorumcu Rıdvan Dilmen, Galatasaraylı oyuncu Barış Alper Yılmaz'ın performansını överek, \"Bugünkü kadar etkili hiç görmedim Barış’ı. Arabistan takımı gelip seyretse bir 20 milyon euro daha verirdi\" dedi. Dilmen, Yılmaz'ın hem kuvvetli hem de egoist olmayan oyunuyla dikkat çektiğini belirtti. Ayrıca, İlkay Gündoğan'ın fiziksel durumunun Şampiyonlar Ligi maçı için yetersiz olabileceğini ve Mauro Icardi'nin tam hazır olmasa da fedakarlık yapması gerektiğini ifade etti.",
      "source": "www.ntvspor.net",
      "published_date": "2025-11-22T19:51:17.215000+00:00",
      "categories": [
        "match_results",
        "performance_analysis",
        "transfers_rumors"
      ],
      "key_entities": {
        "competitions": [
          "Şampiyonlar Ligi"
        ],
        "locations": [],
        "players": [
          "Rıdvan Dilmen",
          "Barış Alper Yılmaz",
          "İlkay Gündoğan",
          "Mauro Icardi",
          "Singo",
          "Sallai",
          "Lemina",
          "Yusuf",
          "Okan Buruk"
        ],
        "teams": [
          "Galatasaray",
          "Gençlerbirliği"
        ]
      },
      "content_quality": "high",
      "confidence": 0.9,
      "language": "turkish"
    },
    {
      "original_url": "https://www.ntvspor.net/foto-galeri/lewandowskiden-fenerbahceye-ilk-cevap-geldi-transferde-is-ciddiye-bindi-413202",
      "title": "Lewandowski'den Fenerbahçe'ye ilk cevap geldi: Transferde iş ciddiye bindi",
      "summary": "Hürriyet Gazetesi'nin haberine göre, Fenerbahçe'nin Barcelona'da forma giyen 37 yaşındaki golcü Robert Lewandowski'ye 1.5 yıllık bir teklif sunduğu iddia edildi. Habere göre Lewandowski, bu teklife karşılık 2.5 yıllık bir kontrat talep etti. Yıldız oyuncunun 2026 Dünya Kupası'nda oynamayı hedeflediği ve bu nedenle daha uzun süreli bir sözleşme istediği belirtiliyor. Lewandowski'nin ara transfer döneminde Barcelona'dan ayrılma ihtimalinin olduğu ve bu sezon 12 maçta 7 gol kaydettiği bilgisi de paylaşıldı.",
      "source": "www.ntvspor.net",
      "published_date": "2025-11-22T08:30:22.569000+00:00",
      "categories": [
        "transfers_rumors",
        "transfers_negotiations"
      ],
      "key_entities": {
        "competitions": [
          "Dünya Kupası"
        ],
        "locations": [],
        "players": [
          "Robert Lewandowski"
        ],
        "teams": [
          "Fenerbahçe",
          "Barcelona"
        ]
      },
      "content_quality": "high",
      "confidence": 0.9,
      "language": "turkish"
    },
    {
      "original_url": "https://www.ntvspor.net/foto-galeri/fredi-fenerbahceden-koparacak-gelisme-yonetim-kararini-coktan-verdi-413198",
      "title": "Fred'i Fenerbahçe'den koparacak gelişme! Yönetim kararını çoktan verdi",
      "summary": "Milliyet Gazetesi'ne göre, Fenerbahçe'nin Brezilyalı orta saha oyuncusu Fred'e ülkesinden Internacional ve Atletico Mineiro'nun ardından Flamengo da talip oldu. Haberde, Fenerbahçe yönetiminin, 1.5 yıl daha sözleşmesi bulunan 32 yaşındaki oyuncu için iyi bir teklif gelmesi halinde bunu değerlendirmeyi planladığı belirtildi. Ancak Teknik Direktör Domenico Tedesco'nun Fred'in takımda kalması yönünde rapor sunduğu ve oyuncunun geleceğinin ilerleyen haftalardaki performansına bağlı olacağı vurgulandı. Fred bu sezon 18 maçta 1 gol ve 2 asistlik performans sergiledi.",
      "source": "www.ntvspor.net",
      "published_date": "2025-11-22T06:51:26.341000+00:00",
      "categories": [
        "transfers_rumors",
        "departures",
        "contract_disputes"
      ],
      "key_entities": {
        "competitions": [],
        "locations": [],
        "players": [
          "Fred",
          "Domenico Tedesco"
        ],
        "teams": [
          "Fenerbahçe",
          "Flamengo",
          "Internacional",
          "Atletico Mineiro"
        ]
      },
      "content_quality": "high",
      "confidence": 0.9,
      "language": "turkish"
    },
    {
      "original_url": "https://www.ntvspor.net/foto-galeri/eyvah-fenerbahcede-bir-eksik-daha-ferencvaros-macinda-o-da-yok-413435",
      "title": "Eyvah! Fenerbahçe'de bir eksik daha: Ferencvaros maçında o da yok",
      "summary": "Fenerbahçe, 27 Kasım Perşembe günü oynanacak UEFA Avrupa Ligi'ndeki kritik Ferencvaros maçı öncesi eksiklerle boğuşuyor. Sarı kart cezalısı olan Jayden Oosterwolde, İsmail Yüksek ve Fred'in yanı sıra sakatlıkları bulunan Sebastian Szymanski ve Çağlar Söyüncü de forma giyemeyecek. Ayrıca, UEFA listesinde yer almayan Becao, Bartuğ Elmaz, Mert Hakan ve kadro dışı bırakılan İrfan Can Kahveci ile Cenk Tosun da maçta görev alamayacak. Cenk Tosun'un yerine listeye dahil edilen Levent Mercan, teknik direktör Tedesco'nun görev vermesi halinde oynayabilecek.",
      "source": "www.ntvspor.net",
      "published_date": "2025-11-26T09:01:16.306000+00:00",
      "categories": [
        "injury_news",
        "disciplinary_actions",
        "squad_changes",
        "european_competitions"
      ],
      "key_entities": {
        "competitions": [
          "UEFA Avrupa Ligi"
        ],
        "locations": [],
        "players": [
          "Jayden Oosterwolde",
          "İsmail Yüksek",
          "Fred",
          "Sebastian Szymanski",
          "Çağlar Söyüncü",
          "Becao",
          "Bartuğ Elmaz",
          "Mert Hakan",
          "İrfan Can Kahveci",
          "Cenk Tosun",
          "Levent Mercan"
        ],
        "teams": [
          "Fenerbahçe",
          "Ferencvaros"
        ]
      },
      "content_quality": "high",
      "confidence": 0.9,
      "language": "turkish"
    },
    {
      "original_url": "https://www.ntvspor.net/foto-galeri/ederson-pfdkya-sevk-edilir-edilmez-fenerbahceden-karsi-hamle-geldi-413398",
      "title": "Ederson PFDK'ya sevk edilir edilmez Fenerbahçe'den karşı hamle geldi",
      "summary": "Fenerbahçe'nin kalecisi Ederson Santana de Moraes, Rizespor maçındaki 'hakareti' nedeniyle Türkiye Futbol Federasyonu (TFF) tarafından tedbirsiz olarak Profesyonel Futbol Disiplin Kurulu'na (PFDK) sevk edildi. HT Spor'un haberine göre, Fenerbahçe yönetimi bu sevke karşı harekete geçerek geniş kapsamlı bir savunma dosyası hazırladı. Savunmanın, Ederson'un Manchester City'de oynadığı dönemden itibaren kariyerindeki benzer hareketlere ait maç kayıtlarını içerdiği ve bu hareketlerin oyuncunun karakteristik bir özelliği olduğunu kanıtlamayı amaçladığı belirtildi.",
      "source": "www.ntvspor.net",
      "published_date": "2025-11-25T16:21:56.051000+00:00",
      "categories": [
        "disciplinary_actions",
        "federation_politics"
      ],
      "key_entities": {
        "competitions": [
          "Süper Lig"
        ],
        "locations": [],
        "players": [
          "Ederson Santana de Moraes"
        ],
        "teams": [
          "Fenerbahçe",
          "Rizespor",
          "Manchester City"
        ]
      },
      "content_quality": "high",
      "confidence": 0.9,
      "language": "turkish"
    },
    {
      "original_url": "https://www.ntvspor.net/foto-galeri/ve-irfan-can-kahveci-cephesinden-flas-fenerbahce-hamlesi-geldi-yonetime-bildirdiler-413391",
      "title": "Ve İrfan Can Kahveci cephesinden flaş Fenerbahçe hamlesi geldi: Yönetime bildirdiler",
      "summary": "Fenerbahçe'de kadro dışı bırakılan İrfan Can Kahveci ve Cenk Tosun'un durumu belirsizliğini koruyor. 343 Digital YouTube kanalında Sercan Hamzaoğlu'nun iddiasına göre, İrfan Can Kahveci ve menajeri, Galatasaray derbisinden sonra Fenerbahçe yönetimiyle bir görüşme talep etti. Bu görüşmede oyuncunun kulüpteki geleceği ('tamam mı devam mı?') netleştirilecek. Menajerinin, \"Ona göre takım bakacağız\" dediği belirtildi. Piyasa değeri 6 milyon euro olan 30 yaşındaki İrfan Can'ın kulübüyle 2028'e kadar sözleşmesi bulunuyor.",
      "source": "www.ntvspor.net",
      "published_date": "2025-11-25T13:37:48.017000+00:00",
      "categories": [
        "disciplinary_actions",
        "contract_disputes",
        "departures"
      ],
      "key_entities": {
        "competitions": [],
        "locations": [],
        "players": [
          "İrfan Can Kahveci",
          "Cenk Tosun",
          "Sercan Hamzaoğlu"
        ],
        "teams": [
          "Fenerbahçe",
          "Galatasaray"
        ]
      },
      "content_quality": "high",
      "confidence": 0.9,
      "language": "turkish"
    },
    {
      "original_url": "https://www.ntvspor.net/futbol/fenerbahce-uefa-listesinde-degisiklige-gitti-413346",
      "title": "Fenerbahçe UEFA listesinde değişikliğe gitti",
      "summary": "Fenerbahçe, UEFA'ya bildirdiği oyuncu listesinde bir değişiklik yaptığını duyurdu. Teknik heyetin kararı doğrultusunda, kadro dışı bırakılan golcü Cenk Tosun'un yerine genç oyuncu Levent Mercan listeye eklendi. Bu değişiklikle birlikte Levent Mercan, Perşembe günü oynanacak kritik Ferencvaros maçında forma giyebilecekken, Cenk Tosun ise UEFA organizasyonlarında oynama şansını kaybetti.",
      "source": "www.ntvspor.net",
      "published_date": "2025-11-24T14:33:59.197000+00:00",
      "categories": [
        "squad_changes",
        "disciplinary_actions",
        "european_competitions"
      ],
      "key_entities": {
        "competitions": [
          "UEFA"
        ],
        "locations": [],
        "players": [
          "Cenk Tosun",
          "Levent Mercan"
        ],
        "teams": [
          "Fenerbahçe",
          "Ferencvaros"
        ]
      },
      "content_quality": "high",
      "confidence": 0.9,
      "language": "turkish"
    },
    {
      "original_url": "https://www.ntvspor.net/foto-galeri/tedesconun-fenerbahcesi-mourinhonun-fenerbahcesinden-farkli-spor-yazarlari-ne-dedi-413318",
      "title": "\"Tedesco'nun Fenerbahçe'si, Mourinho'nun Fenerbahçe'sinden farklı\" | Spor yazarları ne dedi?",
      "summary": "Spor yazarları, Fenerbahçe'nin Süper Lig'in 13. haftasında Rizespor'u deplasmanda 2-5 geriden gelerek 5-2 mağlup ettiği maçı değerlendirdi. Uğur Meleke, Asensio'nun liderliğine ve Tedesco'nun 55. dakikadaki hamlelerine dikkat çekti. Halil Özer, Asensio'yu Alex'e benzeterek maç kazandıran bir oyuncu olduğunu belirtti. Gürcan Bilgiç, takımın gösterdiği 'büyük takım refleksi'ni övdü. Serkan Akcan ve İlker Yağcıoğlu gibi yazarlar, Tedesco'nun Fenerbahçe'sinin, Mourinho'nun takımından farklı olarak zorlu fikstürde bile direnç gösterip kazanabildiğini vurguladı. Maç, Fenerbahçe'nin Galatasaray derbisi öncesi liderlik yarışında önemli bir viraj olarak görüldü.",
      "source": "www.ntvspor.net",
      "published_date": "2025-11-24T05:45:51.338000+00:00",
      "categories": [
        "match_results",
        "performance_analysis",
        "tactical_analysis"
      ],
      "key_entities": {
        "competitions": [
          "Süper Lig"
        ],
        "locations": [],
        "players": [
          "Asensio",
          "Mert Müldür",
          "Fred",
          "Talisca",
          "Brown",
          "İsmail Yüksek",
          "Skriniar",
          "Alex",
          "Nene",
          "Laci"
        ],
        "teams": [
          "Fenerbahçe",
          "Rizespor",
          "Galatasaray"
        ]
      },
      "content_quality": "high",
      "confidence": 0.9,
      "language": "turkish"
    },
    {
      "original_url": "https://www.ntvspor.net/foto-galeri/ridvan-dilmen-galatasarayin-maci-biter-bitmez-hayal-diyerek-duyurdu-flas-sampiyonlar-ligi-iddiasi-413423",
      "title": "Rıdvan Dilmen, Galatasaray'ın maçı biter bitmez \"Hayal\" diyerek duyurdu: Flaş Şampiyonlar Ligi iddiası",
      "summary": "Yorumcu Rıdvan Dilmen, Galatasaray'ın Şampiyonlar Ligi 5. hafta maçında Union Saint-Gilloise'ya 1-0 mağlup olmasının ardından değerlendirmelerde bulundu. Dilmen, bu sonuçla Galatasaray'ın turnuvada ilk 8'e girme şansının artık bir 'hayal' olduğunu belirtti. Teknik direktör Okan Buruk'un maç öncesi kadro eksiklikleri nedeniyle hedefi 'ilk 24'e kalmak' olarak belirlediğini hatırlatan Dilmen, bu mağlubiyetin büyük bir fırsatın kaçırılması anlamına geldiğini söyledi.",
      "source": "www.ntvspor.net",
      "published_date": "2025-11-26T04:50:00.870000+00:00",
      "categories": [
        "match_results",
        "performance_analysis",
        "european_competitions"
      ],
      "key_entities": {
        "competitions": [
          "Şampiyonlar Ligi"
        ],
        "locations": [],
        "players": [
          "Rıdvan Dilmen",
          "Okan Buruk"
        ],
        "teams": [
          "Galatasaray",
          "Union Saint-Gilloise"
        ]
      },
      "content_quality": "high",
      "confidence": 0.9,
      "language": "turkish"
    },
    {
      "original_url": "https://www.ntvspor.net/foto-galeri/nihat-kahvecinin-galatasaray-macinda-gorduklerini-akli-almadi-kariyerinin-en-kotu-performansi-413436",
      "title": "Nihat Kahveci'nin Galatasaray maçında gördüklerini aklı almadı: \"Kariyerinin en kötü performansı\"",
      "summary": "Yorumcu Nihat Kahveci, Galatasaray'ın Union Saint Gilloise'ya 1-0 yenildiği maçı değerlendirirken, İlkay Gündoğan'ın performansını sert bir dille eleştirdi. Kahveci, Gündoğan için \"Belki kariyerinin en kötü maç performansını gösteren bir İlkay var\" dedi. Oyuncunun City ve Barcelona'daki performanslarına atıfta bulunarak, bu kadar çok top kaybı yaptığı bir maçı hatırlamadığını ve bu durumu aklının almadığını belirtti, ancak oyuncunun sakatlıktan yeni dönmüş olmasının bir mazeret olabileceğini de ekledi.",
      "source": "www.ntvspor.net",
      "published_date": "2025-11-26T09:27:11.152000+00:00",
      "categories": [
        "match_results",
        "performance_analysis",
        "european_competitions"
      ],
      "key_entities": {
        "competitions": [],
        "locations": [],
        "players": [
          "İlkay Gündoğan",
          "Nihat Kahveci"
        ],
        "teams": [
          "Galatasaray",
          "Union Saint Gilloise",
          "City",
          "Barcelona",
          "Manchester City"
        ]
      },
      "content_quality": "high",
      "confidence": 0.9,
      "language": "turkish"
    },
    {
      "original_url": "https://www.ntvspor.net/foto-galeri/belcika-basinindan-kustah-baslik-galatasaray-union-sg-maci-ulke-gundemine-oturdu-413425",
      "title": "Belçika basınından küstah başlık: Galatasaray-Union SG maçı ülke gündemine oturdu",
      "summary": "Union SG'nin Şampiyonlar Ligi'nde Galatasaray'ı deplasmanda 1-0 yenmesi Belçika basınında geniş yer buldu. Birçok gazete galibiyeti 'tarihi bir zafer' olarak nitelendirdi. De Morgen gazetesi, \"Union SG, Promise David'in golüyle 50.000 Türk'ü susturdu\" başlığını kullandı. 7sur7 gazetesi ise 'Devasa bir başarı!' başlığıyla, Union'ın bu galibiyetle Galatasaray'ın Ağustos 2024'ten beri süren iç saha yenilmezlik serisini sonlandırdığını vurguladı. Diğer gazeteler de benzer şekilde galibiyetin önemine dikkat çekti.",
      "source": "www.ntvspor.net",
      "published_date": "2025-11-26T05:43:39.616000+00:00",
      "categories": [
        "match_results",
        "european_competitions",
        "fan_rivalry"
      ],
      "key_entities": {
        "competitions": [
          "Şampiyonlar Ligi"
        ],
        "locations": [
          "Belçika"
        ],
        "players": [
          "Promise David"
        ],
        "teams": [
          "Galatasaray",
          "Union SG"
        ]
      },
      "content_quality": "high",
      "confidence": 0.9,
      "language": "turkish"
    },
    {
      "original_url": "https://www.ntvspor.net/foto-galeri/galatasaray-kaybetti-hasan-sas-canli-yayinda-o-isme-agzina-geleni-soyledi-sen-seref-yoksunusun-413426",
      "title": "Galatasaray kaybetti, Hasan Şaş canlı yayında o isme ağzına geleni söyledi: \"Sen şeref yoksunusun\"",
      "summary": "Galatasaray'ın Şampiyonlar Ligi'nde Union Saint-Gilloise'ya 1-0 yenildiği maçın ardından, eski futbolcu ve yorumcu Hasan Şaş, maçın İspanyol hakemi Jose Maria Sanchez'i çok sert bir dille eleştirdi. Bir YouTube yayınında konuşan Şaş, hakemin maçı katlettiğini belirterek, \"Sen şeref yoksunusun hakem. Sen şeref yoksunu bir hakemsin!\" dedi. Şaş, hakemin genç oyuncu Arda Ünyay'ı oyundan atarken, rakip takımdan Uğurcan'ın ayağına basan ve sarı kartı olan bir oyuncuyu atmamasını eleştirdi.",
      "source": "www.ntvspor.net",
      "published_date": "2025-11-26T05:36:35.235000+00:00",
      "categories": [
        "match_results",
        "field_incidents",
        "scandal/controversy",
        "european_competitions"
      ],
      "key_entities": {
        "competitions": [
          "Şampiyonlar Ligi"
        ],
        "locations": [],
        "players": [
          "Arda Ünyay",
          "Uğurcan",
          "Hasan Şaş",
          "Jose Maria Sanchez"
        ],
        "teams": [
          "Galatasaray",
          "Union Saint-Gilloise"
        ]
      },
      "content_quality": "high",
      "confidence": 0.9,
      "language": "turkish"
    },
    {
      "original_url": "https://www.ntvspor.net/foto-galeri/galatasaraya-bedel-mi-odettiler-spor-yazarlari-union-sg-maci-icin-ne-dedi-413422",
      "title": "\"Galatasaray'a bedel mi ödettiler?\" | Spor yazarları, Union SG maçı için ne dedi?",
      "summary": "Spor yazarları, Galatasaray'ın Şampiyonlar Ligi'nde Union SG'ye 1-0 mağlup olduğu maçı çeşitli açılardan değerlendirdi. Levent Tüzemen, İspanyol hakem Jose Maria Sanchez'in yönetimini eleştirerek, \"Milli takımımızın İspanya'ya, Sevilla'da diz çöktürmesinin bedelini Sanchez, G.Saray'a ödettirdi\" şeklinde bir iddiada bulundu. Serkan Akcan, fiziksel olarak hazır olmayan Icardi'nin takım için 'lüks değil yük' olduğunu belirtti. Uğur Meleke, Osimhen gibi kilit oyuncuların yokluğunun ve orta saha eksikliklerinin mağlubiyette büyük rol oynadığını vurguladı. Diğer yazarlar da takımın yetersiz performansına, eksiklerine ve kaçan fırsata dikkat çekti.",
      "source": "www.ntvspor.net",
      "published_date": "2025-11-26T04:49:45.010000+00:00",
      "categories": [
        "match_results",
        "performance_analysis",
        "field_incidents",
        "scandal/controversy",
        "european_competitions"
      ],
      "key_entities": {
        "competitions": [
          "Şampiyonlar Ligi"
        ],
        "locations": [
          "Sevilla"
        ],
        "players": [
          "Osimhen",
          "Mauro Icardi",
          "İlkay Gündoğan",
          "Torreira",
          "Sara",
          "Lemina",
          "Sane",
          "Jakobs",
          "Arda Ünyay",
          "Okan Buruk",
          "Jose Maria Sanchez"
        ],
        "teams": [
          "Galatasaray",
          "Union SG",
          "Manchester United",
          "Liverpool",
          "Sevilla"
        ]
      },
      "content_quality": "high",
      "confidence": 0.9,
      "language": "turkish"
    },
    {
      "original_url": "https://www.ntvspor.net/foto-galeri/okan-buruktan-osimhen-lemina-ve-yunus-akgun-yaniti-fenerbahce-derbisine-yetisecekler-mi-413414",
      "title": "Okan Buruk'tan Osimhen, Lemina ve Yunus Akgün yanıtı: Fenerbahçe derbisine yetişecekler mi?",
      "summary": "Galatasaray Teknik Direktörü Okan Buruk, Union SG'ye 1-0 kaybedilen Şampiyonlar Ligi maçı sonrası yaptığı açıklamada, sakat oyuncuların durumu hakkında bilgi verdi. Buruk, \"Fenerbahçe maçında 6 günlük bir süre var. Lemina, Osimhen ve Yunus’u oraya yetiştirmeye çalışacağız\" dedi. Ayrıca, 21 Aralık'ta başlayacak Afrika Uluslar Kupası'na muhtemelen 4 oyuncularının gideceğini, bu oyuncuların Kasımpaşa maçında olmayacaklarını ancak bir sonraki Avrupa maçına yetişebileceklerini belirtti.",
      "source": "www.ntvspor.net",
      "published_date": "2025-11-25T21:04:32.871000+00:00",
      "categories": [
        "injury_news",
        "international_tournaments",
        "team_rivalry"
      ],
      "key_entities": {
        "competitions": [
          "Şampiyonlar Ligi",
          "Afrika Uluslar Kupası"
        ],
        "locations": [],
        "players": [
          "Osimhen",
          "Lemina",
          "Yunus Akgün",
          "Okan Buruk"
        ],
        "teams": [
          "Galatasaray",
          "Fenerbahçe",
          "Union SG",
          "Kasımpaşa",
          "Antalyaspor"
        ]
      },
      "content_quality": "high",
      "confidence": 0.9,
      "language": "turkish"
    },
    {
      "original_url": "https://www.ntvspor.net/futbol/ilkay-gundogan-yeterli-degil-ama-dedi-galatasaray-icin-kalan-maclarin-hedefini-cizdi-413407",
      "title": "İlkay Gündoğan \"Yeterli değil ama...\" dedi: Galatasaray için kalan maçların hedefini çizdi",
      "summary": "Galatasaray'ın Şampiyonlar Ligi'nde Union SG'ye 1-0 yenildiği maçın ardından oyuncu İlkay Gündoğan açıklamalarda bulundu. Gündoğan, \"Çok hata yaptık. Top kayıpları yaptık çok fazla. Bizim için üzücü bir akşam\" diyerek takımın performansını eleştirdi. Bir aylık sakatlık sonrası oynamanın kolay olmadığını ve hem kendisinin hem de takımın daha iyi olması gerektiğini belirten tecrübeli oyuncu, \"Bundan sonra önümüze bakmamız gerekiyor. 3 puan play-offları bize getirir. Ama daha iyi olmamız gerekiyor genel anlamda\" sözleriyle takımın kalan maçlardaki hedefini ortaya koydu.",
      "source": "www.ntvspor.net",
      "published_date": "2025-11-25T20:35:07.207000+00:00",
      "categories": [
        "match_results",
        "performance_analysis",
        "european_competitions"
      ],
      "key_entities": {
        "competitions": [
          "Şampiyonlar Ligi"
        ],
        "locations": [],
        "players": [
          "İlkay Gündoğan"
        ],
        "teams": [
          "Galatasaray",
          "Union SG"
        ]
      },
      "content_quality": "high",
      "confidence": 0.9,
      "language": "turkish"
    },
    {
      "original_url": "https://www.ntvspor.net/foto-galeri/sampiyonlar-ligi-guncel-puan-durumu-galatasaray-devler-liginde-kacinci-413409",
      "title": "Şampiyonlar Ligi güncel puan durumu: Galatasaray, Devler Ligi'nde kaçıncı?",
      "summary": "UEFA Şampiyonlar Ligi'nin 5. haftasında Galatasaray, sahasında Union SG'ye 57. dakikada Promise David'in golüyle 1-0 mağlup oldu. Bu sonuçla sarı-kırmızılıların 3 maçlık galibiyet serisi sona erdi ve 9 puanda kalarak lig etabında 11. sıraya geriledi. Galatasaray'ın kalan maçları Monaco, Atletico Madrid ve Manchester City ile olacak. Makalede, ilk 16 takımın yer aldığı güncel puan durumu listesi de paylaşıldı.",
      "source": "www.ntvspor.net",
      "published_date": "2025-11-25T19:40:47.380000+00:00",
      "categories": [
        "match_results",
        "league_standings",
        "european_competitions"
      ],
      "key_entities": {
        "competitions": [
          "UEFA Şampiyonlar Ligi"
        ],
        "locations": [],
        "players": [
          "Promise David"
        ],
        "teams": [
          "Galatasaray",
          "Union SG",
          "Bayern Münih",
          "Arsenal",
          "Inter",
          "Borussia Dortmund",
          "Chelsea",
          "Manchester City",
          "Paris Saint-Germain",
          "Newcastle United",
          "Real Madrid",
          "Liverpool",
          "Tottenham",
          "Bayer Leverkusen",
          "Sporting",
          "Barcelona",
          "Karabağ",
          "Monaco",
          "Atletico Madrid"
        ]
      },
      "content_quality": "high",
      "confidence": 0.9,
      "language": "turkish"
    },
    {
      "original_url": "https://www.ntvspor.net/basketbol/fenerbahce-beko-ikinci-yari-geri-donusuyle-kazandi-413305",
      "title": "Fenerbahçe Beko ikinci yarı geri dönüşüyle kazandı",
      "summary": "Türkiye Sigorta Basketbol Süper Ligi'nin 9. haftasında Fenerbahçe Beko, ilk yarısını 41-45 geride kapattığı maçta Bursaspor Basketbol'u 92-84 mağlup etti. Ülker Spor ve Etkinlik Salonu'nda oynanan karşılaşmada Fenerbahçe'den Baldwin ve Onuralp Bitim 18'er sayıyla takımın en skorerleri olurken, Bursaspor'da Childress'ın 22 sayısı galibiyete yetmedi.",
      "source": "www.ntvspor.net",
      "published_date": "2025-11-23T20:03:31.252000+00:00",
      "categories": [
        "match_results",
        "basketball",
        "domestic_leagues_basketball"
      ],
      "key_entities": {
        "competitions": [
          "Türkiye Sigorta Basketbol Süper Ligi"
        ],
        "locations": [
          "Ülker Spor ve Etkinlik Salonu"
        ],
        "players": [
          "Bacot",
          "Biberovic",
          "Jantunen",
          "Hall",
          "Zagars",
          "Metecan Birsen",
          "Baldwin",
          "Melih Mahmutoğlu",
          "Boston",
          "Onuralp Bitim",
          "Birch",
          "Childress",
          "Parsons",
          "Göksenin Köksal",
          "Crawford",
          "King"
        ],
        "teams": [
          "Fenerbahçe Beko",
          "Bursaspor Basketbol"
        ]
      },
      "content_quality": "high",
      "confidence": 0.9,
      "language": "turkish"
    },
    {
      "original_url": "https://www.ntvspor.net/basketbol/fenerbahce-beko-sirbistan-deplasmaninda-413111",
      "title": "Fenerbahçe Beko, Sırbistan deplasmanında",
      "summary": "Fenerbahçe Beko, Basketbol EuroLeague'in 12. haftasında Sırbistan ekibi Partizan ile deplasmanda karşılaşacak. 21 Kasım Cuma günü Belgrad Arena'da TSİ 22.30'da başlayacak olan maç, S Sport'tan canlı yayınlanacak. Haftaya 6 galibiyet ve 5 yenilgi ile 10. sırada giren Fenerbahçe, 4 galibiyet ve 7 yenilgisi bulunan 17. sıradaki Partizan ile 11. kez EuroLeague'de karşı karşıya gelecek. Önceki 10 maçta iki takım da 5'er galibiyet elde etti.",
      "source": "www.ntvspor.net",
      "published_date": "2025-11-20T07:46:02.278000+00:00",
      "categories": [
        "european_competitions",
        "basketball"
      ],
      "key_entities": {
        "competitions": [
          "EuroLeague"
        ],
        "locations": [
          "Sırbistan",
          "Belgrad Arena"
        ],
        "players": [],
        "teams": [
          "Fenerbahçe Beko",
          "Partizan"
        ]
      },
      "content_quality": "high",
      "confidence": 0.9,
      "language": "turkish"
    },
    {
      "original_url": "https://www.ntvspor.net/basketbol/galatasaray-mct-technic-sahasinda-kazandi-413285",
      "title": "Galatasaray MCT Technic sahasında kazandı",
      "summary": "Türkiye Sigorta Basketbol Süper Ligi'nin 9. haftasında Galatasaray MCT Technic, sahasında Esenler Erokspor'u 88-76 mağlup etti. Maçta Galatasaray'ın ABD'li oyuncusu Errick McCollum, lig kariyerindeki 3000. sayısını kaydetti. Ayrıca, takımın 33 yaşındaki oyun kurucusu Can Korkmaz da Esenler Erokspor'a karşı kariyerinin 300. Basketbol Süper Ligi maçına çıktı.",
      "source": "www.ntvspor.net",
      "published_date": "2025-11-23T15:16:36.481000+00:00",
      "categories": [
        "match_results",
        "basketball",
        "domestic_leagues_basketball"
      ],
      "key_entities": {
        "competitions": [
          "Türkiye Sigorta Basketbol Süper Ligi"
        ],
        "locations": [],
        "players": [
          "Errick McCollum",
          "Can Korkmaz"
        ],
        "teams": [
          "Galatasaray MCT Technic",
          "Esenler Erokspor"
        ]
      },
      "content_quality": "high",
      "confidence": 0.9,
      "language": "turkish"
    }
];

export const fetchNews = async (region: SourceRegion = 'eu', date?: string, token?: string): Promise<NewsEntry[]> => {
    try {
      let url = `/api/news?region=${region}`;
      if (date) {
        url += `&date=${date}`;
      }
      
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, { headers });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
           console.error("Authentication failed");
           throw new Error("Authentication failed");
        }
        // Return empty array instead of mock data to avoid showing wrong region data
        console.warn(`No data found for ${region}${date ? ` on ${date}` : ''}`);
        return [];
      }
      const articles: ProcessedArticle[] = await response.json();
      
      return articles.map((article, index) => ({
        ...article,
        id: `entry-${region}-${index}`,
        status: Math.random() > 0.8 ? PostStatus.POSTED : PostStatus.PENDING
      }));
    } catch (error) {
      console.error("Failed to fetch news:", error);
      throw error; // Re-throw to handle in UI
    }
};
