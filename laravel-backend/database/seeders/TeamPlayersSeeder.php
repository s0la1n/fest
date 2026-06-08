<?php

namespace Database\Seeders;

use App\Models\Team;
use App\Models\TeamPlayer;
use Illuminate\Database\Seeder;

class TeamPlayersSeeder extends Seeder
{
    private array $playerNicknames = [
        'ViPeR', 'Ph0enix', 'Shad0w', 'Bl4de', 'St0rm', 'Thund3r', 'Fr0st', 'Fl4me', 'St33l', 'Cryst4l',
        'N1ght', 'D4wn', 'R4ven', 'W0lf', 'H4wk', 'T1ger', 'Dr4gon', 'S3rp3nt', 'F0x', 'B3ar',
        'Gh0st', 'R3ap3r', 'Cl0wn', 'J0k3r', 'K1ng', 'Qu33n', 'Pr1nc3', 'Kn1ght', 'W1zard', 'Elf',
        'Drw4rf', '0rc', 'G0bl1n', 'Dr4g0n', 'Ph03n1x', 'Ch1m3ra', 'Gr1ff1n', 'P3gasus', 'Un1c0rn', 'C3rb3rus'
    ];
    
    private array $playerNames = [
        'Александр', 'Дмитрий', 'Максим', 'Сергей', 'Андрей', 'Алексей', 'Иван', 'Егор', 'Никита', 'Михаил',
        'Артем', 'Владимир', 'Павел', 'Денис', 'Роман', 'Кирилл', 'Даниил', 'Матвей', 'Лев', 'Тимофей',
        'Давид', 'Мирон', 'Ярослав', 'Степан', 'Марк', 'Владислав', 'Глеб', 'Богдан', 'Илья', 'Олег',
        'Константин', 'Николай', 'Виктор', 'Валентин', 'Евгений', 'Анатолий', 'Геннадий', 'Юрий', 'Станислав', 'Виталий'
    ];
    
    private array $lastNames = [
        'Иванов', 'Смирнов', 'Кузнецов', 'Попов', 'Васильев', 'Петров', 'Соколов', 'Михайлов', 'Новиков', 'Федоров',
        'Морозов', 'Волков', 'Алексеев', 'Лебедев', 'Семенов', 'Егоров', 'Павлов', 'Козлов', 'Степанов', 'Николаев',
        'Орлов', 'Андреев', 'Макаров', 'Никитин', 'Захаров', 'Соловьёв', 'Борисов', 'Яковлев', 'Григорьев', 'Романов',
        'Воробьев', 'Титов', 'Белов', 'Кузьмин', 'Фролов', 'Давыдов', 'Крылов', 'Максимов', 'Сидоров', 'Поляков'
    ];

    // Счетчики для генерации уникальных ников
    private array $nicknameCounters = [];

    public function run(): void
    {
        echo "Добавление игроков в команды...\n";
        
        $teams = Team::all();
        $teamsCount = $teams->count();
        
        // Создаем копии массивов для циклического использования
        $namesCount = count($this->playerNames);
        $lastNamesCount = count($this->lastNames);
        $nicknamesCount = count($this->playerNicknames);
        
        $teamIndex = 0;
        
        foreach ($teams as $team) {
            if ($team->players()->count() > 0) {
                echo "  Команда {$team->team_name} уже имеет игроков\n";
                continue;
            }
            
            echo "  Команда: {$team->team_name} [{$team->tag}]\n";
            $teamPlayers = [];
            
            for ($i = 0; $i < 5; $i++) {
                // Генерируем уникальный ник с использованием счетчика
                $baseNick = $this->playerNicknames[($teamIndex * 5 + $i) % $nicknamesCount];
                $nicknameKey = $baseNick . '_' . $team->tag;
                
                if (!isset($this->nicknameCounters[$nicknameKey])) {
                    $this->nicknameCounters[$nicknameKey] = 0;
                }
                
                if ($this->nicknameCounters[$nicknameKey] > 0) {
                    $nickname = $nicknameKey . ($this->nicknameCounters[$nicknameKey] + 1);
                } else {
                    $nickname = $nicknameKey;
                }
                $this->nicknameCounters[$nicknameKey]++;
                
                // Циклически выбираем имя и фамилию
                $nameIndex = ($teamIndex * 5 + $i) % $namesCount;
                $lastNameIndex = ($teamIndex * 5 + $i) % $lastNamesCount;
                $fullName = $this->playerNames[$nameIndex] . ' ' . $this->lastNames[$lastNameIndex];
                
                $role = ($i === 0) ? 'captain' : 'player';
                
                $player = TeamPlayer::create([
                    'team_id' => $team->id,
                    'name' => $fullName,
                    'nickname' => $nickname,
                    'role' => $role,
                ]);
                
                $teamPlayers[] = "    * {$nickname} ({$fullName}) - " . ($role === 'captain' ? 'Капитан' : 'Игрок');
            }
            
            $teamIndex++;
        }
    }
}