<?php
// Normalize explicit hotel/room metadata; never inherit attributes from demo slugs.
function hotelFilterText(string $value): string
{
    $value = mb_strtolower($value, 'UTF-8');
    static $replacements = null;
    if ($replacements === null) {
        $replacements = [];
        $groups = ['a'=>'àáạảãâầấậẩẫăằắặẳẵ','e'=>'èéẹẻẽêềếệểễ','i'=>'ìíịỉĩ','o'=>'òóọỏõôồốộổỗơờớợởỡ','u'=>'ùúụủũưừứựửữ','y'=>'ỳýỵỷỹ','d'=>'đ'];
        foreach ($groups as $plain=>$chars) foreach (preg_split('//u',$chars,-1,PREG_SPLIT_NO_EMPTY) as $char) $replacements[$char]=$plain;
    }
    $value = strtr($value, $replacements);
    return trim(preg_replace('/[^a-z0-9]+/', ' ', $value));
}
function hotelFilterMetadata(array $hotel, array $amenities, array $rooms): array
{
    $patterns = [
        'breakfast'=>'/\b(breakfast|bua sang)\b/',
        'parking'=>'/\b(parking|car park|bai xe|bai (do|dau) xe|cho (do|dau) xe)\b/',
        'fireplace'=>'/\b(fireplace|lo suoi|bbq|barbecue|tiec nuong|nuong ngoai troi)\b/',
        'valley'=>'/\b(valley|thung lung)\b/',
        'lake'=>'/\b(lake view|view lake|view ho|huong ho|nhin ra ho)\b/',
        'pool'=>'/\b(pool|ho boi|be boi)\b/',
        'sea'=>'/\b(sea view|ocean view|view sea|view bien|huong bien|nhin ra bien)\b/',
        'sunset'=>'/\b(sunset|hoang hon)\b/',
        'wifi'=>'/\b(wifi|wi fi|internet)\b/',
        'restaurant'=>'/\b(restaurant|nha hang)\b/',
        'checkin24'=>'/\b(checkin24|checkin 24|check in 24|nhan phong 24|le tan 24|24 hour reception)\b/',
        'garden'=>'/\b(garden|vuon rieng|san vuon)\b/',
        'shuttle'=>'/\b(airport shuttle|shuttle|dua don san bay)\b/',
    ];
    $found=[];$zones=[];
    $add = static function(string $value) use (&$found,$patterns): void {
        $text=hotelFilterText($value);
        if (preg_match('/\b(khong co|khong bao gom|khong ho tro|without|not included|no)\b/',$text)) return;
        foreach ($patterns as $key=>$pattern) if ($text===$key || preg_match($pattern,$text)) $found[$key]=true;
    };
    foreach ($amenities as $a) {
        $add((string)$a['code']);$add((string)$a['label']);
        foreach (['center','forest','beach'] as $zone) if ($a['code']==='location_'.$zone || $a['code']===$zone) $zones[$zone]=true;
    }
    foreach ($rooms as $room) {
        if ((int)$room['breakfast_included']===1) $found['breakfast']=true;
        $features=json_decode($room['features_json']??'[]',true);
        if (is_array($features)) foreach ($features as $feature) if (is_string($feature)) $add($feature);
    }
    // Only positive, explicit location descriptions qualify; no invented geo distances.
    $sentences=preg_split('/[.!?;\n]+/u',($hotel['address']??'')."\n".($hotel['description']??''));
    foreach ($sentences as $sentence) {
        $text=hotelFilterText($sentence);
        if (preg_match('/\b(khong gan|xa trung tam|xa bien|xa ho|xa rung|xa cho|khong thuoc)\b/',$text)) continue;
        if (preg_match('/\bcach\b.*\b(km|met|m)\b/', $text)) continue;
        if (preg_match('/\b(trung tam|cho da lat|cho dem da lat|cho dem vung tau|city center|city centre)\b/',$text)) $zones['center']=true;
        if (($hotel['city']??'')==='dalat' && preg_match('/\b(tuyen lam|ven rung|gan rung|rung thong|forest)\b/',$text)) $zones['forest']=true;
        if (($hotel['city']??'')==='vungtau' && preg_match('/\b(gan bien|ven bien|sat bien|bai sau|bai truoc|thuy van|beachfront|near the beach)\b/',$text)) $zones['beach']=true;
    }
    return ['filter_amenities'=>array_keys($found),'zones'=>array_keys($zones)];
}
