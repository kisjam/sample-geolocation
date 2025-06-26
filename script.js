class LocationDistance {
    constructor() {
        this.getLocationBtn = document.getElementById('getLocationBtn');
        this.loading = document.getElementById('loading');
        this.error = document.getElementById('error');
        this.results = document.getElementById('results');
        this.kyotoDistance = document.getElementById('kyotoDistance');
        this.osakaDistance = document.getElementById('osakaDistance');
        this.kobeDistance = document.getElementById('kobeDistance');
        this.currentLocation = document.getElementById('currentLocation');
        this.areaStatus = document.getElementById('areaStatus');
        
        // 駅の座標（緯度、経度）
        this.stations = {
            kyoto: {
                name: 'JR京都駅',
                lat: 34.985849,
                lng: 135.758767
            },
            osaka: {
                name: 'JR新大阪駅',
                lat: 34.733141,
                lng: 135.500107
            },
            kobe: {
                name: 'JR神戸駅',
                lat: 34.669029,
                lng: 135.194992
            }
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.hideElements();
    }
    
    setupEventListeners() {
        this.getLocationBtn.addEventListener('click', () => {
            this.getCurrentLocation();
        });
    }
    
    hideElements() {
        this.loading.style.display = 'none';
        this.error.style.display = 'none';
        this.results.style.display = 'none';
    }
    
    getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showError('このブラウザでは位置情報がサポートされていません。');
            return;
        }
        
        this.getLocationBtn.style.display = 'none';
        this.loading.style.display = 'block';
        this.error.style.display = 'none';
        
        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5分間キャッシュ
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
        
        this.loading.style.display = 'none';
        this.results.style.display = 'block';
        
        // 各駅までの距離を計算
        const kyotoDistance = this.calculateDistance(
            userLat, userLng,
            this.stations.kyoto.lat, this.stations.kyoto.lng
        );
        
        const osakaDistance = this.calculateDistance(
            userLat, userLng,
            this.stations.osaka.lat, this.stations.osaka.lng
        );
        
        const kobeDistance = this.calculateDistance(
            userLat, userLng,
            this.stations.kobe.lat, this.stations.kobe.lng
        );
        
        // 結果を表示
        this.kyotoDistance.textContent = `${kyotoDistance.toFixed(2)} km`;
        this.osakaDistance.textContent = `${osakaDistance.toFixed(2)} km`;
        this.kobeDistance.textContent = `${kobeDistance.toFixed(2)} km`;
        
        // エリア判定とメッセージ表示
        this.checkAreaStatus(kyotoDistance, osakaDistance, kobeDistance);
        
        // 現在地情報を表示
        this.currentLocation.innerHTML = `
            <p><strong>現在地:</strong></p>
            <p>緯度: ${userLat.toFixed(6)}</p>
            <p>経度: ${userLng.toFixed(6)}</p>
            <p>精度: ±${position.coords.accuracy.toFixed(0)}m</p>
        `;
        
        // ボタンを再表示
        this.getLocationBtn.style.display = 'block';
        this.getLocationBtn.textContent = '位置情報を更新';
    }
    
    onLocationError(error) {
        this.loading.style.display = 'none';
        this.getLocationBtn.style.display = 'block';
        
        let errorMessage = '';
        switch(error.code) {
            case error.PERMISSION_DENIED:
                errorMessage = '位置情報の取得が拒否されました。ブラウザの設定を確認してください。';
                break;
            case error.POSITION_UNAVAILABLE:
                errorMessage = '位置情報が利用できません。';
                break;
            case error.TIMEOUT:
                errorMessage = '位置情報の取得がタイムアウトしました。再度お試しください。';
                break;
            default:
                errorMessage = '位置情報の取得中にエラーが発生しました。';
                break;
        }
        
        this.showError(errorMessage);
    }
    
    showError(message) {
        this.error.textContent = message;
        this.error.style.display = 'block';
    }
    
    // ヒュベニの公式を使用した距離計算（日本国内での精度を重視）
    calculateDistance(lat1, lng1, lat2, lng2) {
        const radLat1 = lat1 * Math.PI / 180;
        const radLat2 = lat2 * Math.PI / 180;
        const radLng1 = lng1 * Math.PI / 180;
        const radLng2 = lng2 * Math.PI / 180;
        
        const a = 6378137.0; // 長半径（GRS80）
        const b = 6356752.314140; // 短半径（GRS80）
        const e2 = (a * a - b * b) / (a * a); // 第一離心率の二乗
        
        const averageLat = (radLat1 + radLat2) / 2;
        const deltaLat = radLat1 - radLat2;
        const deltaLng = radLng1 - radLng2;
        
        const sin2AvgLat = Math.sin(averageLat) * Math.sin(averageLat);
        const cos2AvgLat = Math.cos(averageLat) * Math.cos(averageLat);
        
        const w2 = 1 - e2 * sin2AvgLat;
        const w = Math.sqrt(w2);
        
        const m = a * (1 - e2) / (w2 * w);
        const n = a / w;
        
        const t1 = m * deltaLat;
        const t2 = n * Math.cos(averageLat) * deltaLng;
        
        const distance = Math.sqrt(t1 * t1 + t2 * t2);
        
        return distance / 1000; // メートルをキロメートルに変換
    }
    
    checkAreaStatus(kyotoDistance, osakaDistance, kobeDistance) {
        const areaRadius = 10; // 10km圏内
        const withinKyoto = kyotoDistance <= areaRadius;
        const withinOsaka = osakaDistance <= areaRadius;
        const withinKobe = kobeDistance <= areaRadius;
        
        let statusMessage = '';
        let statusClass = '';
        
        if (withinKyoto || withinOsaka || withinKobe) {
            const nearStations = [];
            if (withinKyoto) nearStations.push('京都駅');
            if (withinOsaka) nearStations.push('新大阪駅');
            if (withinKobe) nearStations.push('神戸駅');
            
            statusMessage = `✅ ${nearStations.join('・')}の${areaRadius}km圏内です！\nLESSERアプリにアクセス可能です。`;
            statusClass = 'area-inside';
        } else {
            const nearestStation = this.findNearestStation(kyotoDistance, osakaDistance, kobeDistance);
            statusMessage = `⚠️ 対象エリア外です\n\n最寄り駅: ${nearestStation.name}（${nearestStation.distance.toFixed(2)}km）\n\n【クッションページ】\n駅周辺${areaRadius}km圏内でのみLESSERアプリをご利用いただけます。\n対象エリア内でもう一度お試しください。`;
            statusClass = 'area-outside';
        }
        
        this.areaStatus.textContent = statusMessage;
        this.areaStatus.className = `area-status ${statusClass}`;
        this.areaStatus.style.display = 'block';
    }
    
    findNearestStation(kyotoDistance, osakaDistance, kobeDistance) {
        const distances = [
            { name: 'JR京都駅', distance: kyotoDistance },
            { name: 'JR新大阪駅', distance: osakaDistance },
            { name: 'JR神戸駅', distance: kobeDistance }
        ];
        
        return distances.reduce((nearest, current) => 
            current.distance < nearest.distance ? current : nearest
        );
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LocationDistance();
});