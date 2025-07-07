class LocationDistance {
  constructor() {
    this.getLocationBtn = document.getElementById("getLocationBtn");
    this.loading = document.getElementById("loading");
    this.error = document.getElementById("error");
    this.results = document.getElementById("results");
    this.kyotoDistance = document.getElementById("kyotoDistance");
    this.osakaDistance = document.getElementById("osakaDistance");
    this.kobeDistance = document.getElementById("kobeDistance");
    this.shimizuDistance = document.getElementById("shimizuDistance");
    this.hiltonDistance = document.getElementById("hiltonDistance");
    this.currentLocation = document.getElementById("currentLocation");
    this.areaStatus = document.getElementById("areaStatus");
    this.mapContainer = document.getElementById("map");
    this.map = null;
    this.userMarker = null;
    this.circle = null;

    // 駅の座標（緯度、経度）
    this.stations = {
      kyoto: {
        name: "JR京都駅",
        lat: 34.985849,
        lng: 135.758767,
      },
      osaka: {
        name: "JR新大阪駅",
        lat: 34.733141,
        lng: 135.500107,
      },
      kobe: {
        name: "JR神戸駅",
        lat: 34.669029,
        lng: 135.194992,
      },
      shimizu: {
        name: "京阪清水五条駅",
        lat: 34.995885496651475,
        lng: 135.76858536319637,
      },
      hilton: {
        name: "ダブルツリーbyヒルトン京都東山",
        lat: 34.99522628744346,
        lng: 135.769552120176,
      },
    };

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.hideElements();
  }

  setupEventListeners() {
    this.getLocationBtn.addEventListener("click", () => {
      this.getCurrentLocation();
    });
  }

  hideElements() {
    this.loading.style.display = "none";
    this.error.style.display = "none";
    this.results.style.display = "none";
  }

  getCurrentLocation() {
    if (!navigator.geolocation) {
      this.showError("このブラウザでは位置情報がサポートされていません。");
      return;
    }

    this.getLocationBtn.style.display = "none";
    this.loading.style.display = "block";
    this.error.style.display = "none";

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5分間キャッシュ
    };

    navigator.geolocation.getCurrentPosition(
      (position) => this.onLocationSuccess(position),
      (error) => this.onLocationError(error),
      options
    );
  }

  onLocationSuccess(position) {
    const userLat = position.coords.latitude;
    const userLng = position.coords.longitude;

    this.loading.style.display = "none";
    this.results.style.display = "block";

    // 各駅までの距離を計算
    const kyotoDistance = this.calculateDistance(
      userLat,
      userLng,
      this.stations.kyoto.lat,
      this.stations.kyoto.lng
    );

    const osakaDistance = this.calculateDistance(
      userLat,
      userLng,
      this.stations.osaka.lat,
      this.stations.osaka.lng
    );

    const kobeDistance = this.calculateDistance(
      userLat,
      userLng,
      this.stations.kobe.lat,
      this.stations.kobe.lng
    );

    const shimizuDistance = this.calculateDistance(
      userLat,
      userLng,
      this.stations.shimizu.lat,
      this.stations.shimizu.lng
    );

    const hiltonDistance = this.calculateDistance(
      userLat,
      userLng,
      this.stations.hilton.lat,
      this.stations.hilton.lng
    );

    // 各駅での24時間制限をチェック
    const stationAccess = {
      kyoto: this.checkStationAccess("kyoto", kyotoDistance <= 10),
      osaka: this.checkStationAccess("osaka", osakaDistance <= 10),
      kobe: this.checkStationAccess("kobe", kobeDistance <= 10),
      shimizu: this.checkStationAccess("shimizu", shimizuDistance <= 10),
      hilton: this.checkStationAccess("hilton", hiltonDistance <= 10),
    };

    // 結果を表示
    this.kyotoDistance.innerHTML = `${kyotoDistance.toFixed(2)} km<br><small>${
      stationAccess.kyoto.timeInfo
    }</small>`;
    this.osakaDistance.innerHTML = `${osakaDistance.toFixed(2)} km<br><small>${
      stationAccess.osaka.timeInfo
    }</small>`;
    this.kobeDistance.innerHTML = `${kobeDistance.toFixed(2)} km<br><small>${
      stationAccess.kobe.timeInfo
    }</small>`;
    this.shimizuDistance.innerHTML = `${shimizuDistance.toFixed(
      2
    )} km<br><small>${stationAccess.shimizu.timeInfo}</small>`;
    this.hiltonDistance.innerHTML = `${hiltonDistance.toFixed(
      2
    )} km<br><small>${stationAccess.hilton.timeInfo}</small>`;

    // エリア判定とメッセージ表示
    this.checkAreaStatus(
      kyotoDistance,
      osakaDistance,
      kobeDistance,
      shimizuDistance,
      hiltonDistance
    );

    // 現在地情報を表示
    this.currentLocation.innerHTML = `
            <p><strong>現在地:</strong></p>
            <p>緯度: ${userLat.toFixed(6)}</p>
            <p>経度: ${userLng.toFixed(6)}</p>
            <p>精度: ±${position.coords.accuracy.toFixed(0)}m</p>
        `;

    // 地図を表示
    this.showMap(userLat, userLng);

    // ボタンを再表示
    this.getLocationBtn.style.display = "block";
    this.getLocationBtn.textContent = "位置情報を更新";
  }

  onLocationError(error) {
    this.loading.style.display = "none";
    this.getLocationBtn.style.display = "block";

    let errorMessage = "";
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage =
          "位置情報の取得が拒否されました。ブラウザの設定を確認してください。";
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = "位置情報が利用できません。";
        break;
      case error.TIMEOUT:
        errorMessage =
          "位置情報の取得がタイムアウトしました。再度お試しください。";
        break;
      default:
        errorMessage = "位置情報の取得中にエラーが発生しました。";
        break;
    }

    this.showError(errorMessage);
  }

  showError(message) {
    this.error.textContent = message;
    this.error.style.display = "block";
  }

  // ヒュベニの公式を使用した距離計算（日本国内での精度を重視）
  calculateDistance(lat1, lng1, lat2, lng2) {
    const radLat1 = (lat1 * Math.PI) / 180;
    const radLat2 = (lat2 * Math.PI) / 180;
    const radLng1 = (lng1 * Math.PI) / 180;
    const radLng2 = (lng2 * Math.PI) / 180;

    const a = 6378137.0; // 長半径（GRS80）
    const b = 6356752.31414; // 短半径（GRS80）
    const e2 = (a * a - b * b) / (a * a); // 第一離心率の二乗

    const averageLat = (radLat1 + radLat2) / 2;
    const deltaLat = radLat1 - radLat2;
    const deltaLng = radLng1 - radLng2;

    const sin2AvgLat = Math.sin(averageLat) * Math.sin(averageLat);
    const cos2AvgLat = Math.cos(averageLat) * Math.cos(averageLat);

    const w2 = 1 - e2 * sin2AvgLat;
    const w = Math.sqrt(w2);

    const m = (a * (1 - e2)) / (w2 * w);
    const n = a / w;

    const t1 = m * deltaLat;
    const t2 = n * Math.cos(averageLat) * deltaLng;

    const distance = Math.sqrt(t1 * t1 + t2 * t2);

    return distance / 1000; // メートルをキロメートルに変換
  }

  checkAreaStatus(
    kyotoDistance,
    osakaDistance,
    kobeDistance,
    shimizuDistance,
    hiltonDistance
  ) {
    const areaRadius = 1; // 1km圏内
    const withinKyoto = kyotoDistance <= areaRadius;
    const withinOsaka = osakaDistance <= areaRadius;
    const withinKobe = kobeDistance <= areaRadius;
    const withinShimizu = shimizuDistance <= areaRadius;
    const withinHilton = hiltonDistance <= areaRadius;

    // 各駅での24時間制限をチェック
    const stationAccess = {
      kyoto: this.checkStationAccess("kyoto", withinKyoto),
      osaka: this.checkStationAccess("osaka", withinOsaka),
      kobe: this.checkStationAccess("kobe", withinKobe),
      shimizu: this.checkStationAccess("shimizu", withinShimizu),
      hilton: this.checkStationAccess("hilton", withinHilton),
    };

    let statusMessage = "";
    let statusClass = "";

    // アクセス可能な駅があるかチェック
    const accessibleStations = [];
    const nearStations = [];

    if (stationAccess.kyoto.canAccess) {
      accessibleStations.push("京都駅");
      if (withinKyoto) nearStations.push("京都駅");
    }
    if (stationAccess.osaka.canAccess) {
      accessibleStations.push("新大阪駅");
      if (withinOsaka) nearStations.push("新大阪駅");
    }
    if (stationAccess.kobe.canAccess) {
      accessibleStations.push("神戸駅");
      if (withinKobe) nearStations.push("神戸駅");
    }
    if (stationAccess.shimizu.canAccess) {
      accessibleStations.push("清水五条駅");
      if (withinShimizu) nearStations.push("清水五条駅");
    }
    if (stationAccess.hilton.canAccess) {
      accessibleStations.push("ヒルトン京都東山");
      if (withinHilton) nearStations.push("ヒルトン京都東山");
    }

    if (accessibleStations.length > 0) {
      statusMessage = `✅ アプリにアクセス可能です！\n\n`;

      if (nearStations.length > 0) {
        statusMessage += `現在地: ${nearStations.join(
          "・"
        )}の${areaRadius}km圏内\n`;
      }

      statusMessage += `アクセス可能駅: ${accessibleStations.join("・")}\n\n`;

      // 各駅の詳細情報
      statusMessage += this.getStationDetailsMessage(
        stationAccess,
        withinKyoto,
        withinOsaka,
        withinKobe
      );

      statusClass = "area-inside";
    } else {
      const nearestStation = this.findNearestStation(
        kyotoDistance,
        osakaDistance,
        kobeDistance,
        shimizuDistance,
        hiltonDistance
      );
      statusMessage = `⚠️ アプリにアクセスできません\n\n最寄り駅: ${
        nearestStation.name
      }（${nearestStation.distance.toFixed(2)}km）\n\n【クッションページ】\n`;

      // 各駅の制限状況を表示
      statusMessage += this.getStationDetailsMessage(
        stationAccess,
        withinKyoto,
        withinOsaka,
        withinKobe,
        withinShimizu,
        withinHilton
      );

      statusMessage += `\n駅周辺${areaRadius}km圏内でのみアプリをご利用いただけます。`;
      statusClass = "area-outside";
    }

    this.areaStatus.textContent = statusMessage;
    this.areaStatus.className = `area-status ${statusClass}`;
    this.areaStatus.style.display = "block";
  }

  checkStationAccess(stationKey, isWithinRadius) {
    const now = Date.now();
    const hourLimit = 24 * 60 * 60 * 1000; // 24時間
    const storageKey = `lastAccess_${stationKey}`;
    const lastAccess = localStorage.getItem(storageKey);

    let canAccess = false;
    let reason = "";
    let timeInfo = "";

    if (isWithinRadius) {
      // エリア内にいる場合、アクセス時刻を更新
      localStorage.setItem(storageKey, now.toString());
      canAccess = true;
      reason = "エリア内";
      timeInfo = "現在エリア内";
    } else if (lastAccess) {
      // エリア外だが、過去にアクセスがある場合
      const timeDiff = now - parseInt(lastAccess);
      const elapsedTimeStr = this.formatElapsedTime(timeDiff);

      if (timeDiff <= hourLimit) {
        canAccess = true;
        reason = "24時間以内のアクセス履歴";
        const remainingHours = Math.ceil(
          (hourLimit - timeDiff) / (60 * 60 * 1000)
        );
        timeInfo = `前回から${elapsedTimeStr}経過 (残り${remainingHours}時間有効)`;
      } else {
        reason = "24時間経過";
        timeInfo = `前回から${elapsedTimeStr}経過 (期限切れ)`;
      }
    } else {
      reason = "アクセス履歴なし";
      timeInfo = "未アクセス";
    }

    return {
      canAccess,
      reason,
      timeInfo,
      isWithinRadius,
    };
  }

  formatElapsedTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}日${hours % 24}時間`;
    } else if (hours > 0) {
      return `${hours}時間${minutes % 60}分`;
    } else if (minutes > 0) {
      return `${minutes}分${seconds % 60}秒`;
    } else {
      return `${seconds}秒`;
    }
  }

  getStationDetailsMessage(
    stationAccess,
    withinKyoto,
    withinOsaka,
    withinKobe,
    withinShimizu,
    withinHilton
  ) {
    let message = "";

    const stations = [
      { key: "kyoto", name: "京都駅", within: withinKyoto },
      { key: "osaka", name: "新大阪駅", within: withinOsaka },
      { key: "kobe", name: "神戸駅", within: withinKobe },
      { key: "shimizu", name: "清水五条駅", within: withinShimizu },
      { key: "hilton", name: "ヒルトン京都東山", within: withinHilton },
    ];

    stations.forEach((station) => {
      const access = stationAccess[station.key];
      const status = access.canAccess ? "✅" : "❌";
      const location = station.within ? "(圏内)" : "(圏外)";
      message += `${status} ${station.name}${location}: ${access.timeInfo}\n`;
    });

    return message;
  }

  findNearestStation(
    kyotoDistance,
    osakaDistance,
    kobeDistance,
    shimizuDistance,
    hiltonDistance
  ) {
    const distances = [
      { name: "JR京都駅", distance: kyotoDistance },
      { name: "JR新大阪駅", distance: osakaDistance },
      { name: "JR神戸駅", distance: kobeDistance },
      { name: "京阪清水五条駅", distance: shimizuDistance },
      { name: "ダブルツリーbyヒルトン京都東山", distance: hiltonDistance },
    ];

    return distances.reduce((nearest, current) =>
      current.distance < nearest.distance ? current : nearest
    );
  }

  showMap(userLat, userLng) {
    // 地図コンテナを表示
    this.mapContainer.style.display = "block";

    // 地図が初期化済みの場合はクリア
    if (this.map) {
      this.map.remove();
    }

    // Leaflet地図を初期化
    this.map = L.map("map").setView([userLat, userLng], 15);

    // OpenStreetMapタイルを追加
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);

    // 現在地マーカーを追加
    this.userMarker = L.marker([userLat, userLng])
      .addTo(this.map)
      .bindPopup("現在地")
      .openPopup();

    // 1km円を追加
    this.circle = L.circle([userLat, userLng], {
      color: "#007bff",
      fillColor: "#007bff",
      fillOpacity: 0.2,
      radius: 1000, // 1kmをメートルで指定
    })
      .addTo(this.map)
      .bindPopup("1km圈内");

    // 各駅のマーカーを追加
    Object.entries(this.stations).forEach(([key, station]) => {
      const distance = this.calculateDistance(
        userLat,
        userLng,
        station.lat,
        station.lng
      );
      const isWithin = distance <= 1;

      const marker = L.marker([station.lat, station.lng])
        .addTo(this.map)
        .bindPopup(
          `${station.name}<br>距離: ${distance.toFixed(2)}km${
            isWithin ? '<br><span style="color: green;">1km圈内</span>' : ""
          }`
        );

      // 1km圈内の場合はマーカーの色を変更
      if (isWithin) {
        marker.getElement().style.filter = "hue-rotate(120deg)";
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new LocationDistance();
});
