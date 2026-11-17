<?php
require __DIR__ . '/../api/shared/hotel-filters.php';
function checkFilter(bool $condition, string $label): void {
    if (!$condition) throw new RuntimeException($label);
    echo "PASS $label\n";
}
$far=hotelFilterMetadata(['city'=>'dalat','address'=>'Cách trung tâm 10 km. Xa Hồ Tuyền Lâm.'],[],[]);
checkFilter($far['zones']===[], 'distance-only and negative location references do not invent a nearby zone');
$manual=hotelFilterMetadata(['city'=>'dalat','address'=>'Địa chỉ chưa mô tả khu vực'],[['code'=>'location_center','label'=>'Gần trung tâm']],[]);
checkFilter(in_array('center',$manual['zones'],true), 'explicit administrative location tags work without demo metadata');
$features=hotelFilterMetadata(['city'=>'vungtau','address'=>'Gần biển Bãi Sau'],[],[['breakfast_included'=>1,'features_json'=>json_encode(['Wi-Fi','Hồ bơi','View biển','Không có view hồ','Không có lò sưởi'])]]);
checkFilter(in_array('beach',$features['zones'],true) && in_array('pool',$features['filter_amenities'],true) && in_array('sea',$features['filter_amenities'],true) && in_array('wifi',$features['filter_amenities'],true) && in_array('breakfast',$features['filter_amenities'],true), 'Vietnamese/English room features and included breakfast normalize to filter keys');
checkFilter(!in_array('lake',$features['filter_amenities'],true) && !in_array('fireplace',$features['filter_amenities'],true), 'negative room attributes are not treated as amenities');
