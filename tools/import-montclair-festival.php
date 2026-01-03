<?php
/**
 * Montclair Comedy Festival 2025 Data Import
 *
 * Run via WP-CLI: wp eval-file wp-content/plugins/peanut-festival/tools/import-montclair-festival.php
 * Or include from admin: require_once(PEANUT_FESTIVAL_PATH . 'tools/import-montclair-festival.php');
 *
 * @package Peanut_Festival
 */

if (!defined('ABSPATH')) {
    // Allow running from WP-CLI
    if (php_sapi_name() !== 'cli') {
        exit('Direct access not allowed');
    }
}

/**
 * Import the Montclair Comedy Festival data.
 */
function pf_import_montclair_festival() {
    global $wpdb;

    $results = [
        'festival' => null,
        'venues' => [],
        'performers' => [],
        'shows' => [],
        'assignments' => 0,
    ];

    echo "Starting Montclair Comedy Festival import...\n\n";

    // =========================================================================
    // 1. CREATE FESTIVAL
    // =========================================================================
    echo "Creating festival...\n";

    $festival_data = [
        'name' => 'Montclair Comedy Festival 2025',
        'slug' => 'montclair-comedy-festival-2025',
        'description' => 'Three days of non-stop laughs featuring stand-up, improv, variety shows, and competitions across multiple venues in Montclair, NJ. Over 35 comedians performing in 11 shows.',
        'start_date' => '2025-11-13',
        'end_date' => '2025-11-15',
        'location' => 'Montclair, NJ',
        'status' => 'active',
        'settings' => json_encode([
            'voting_enabled' => true,
            'voting_type' => 'audience',
            'allow_anonymous_votes' => true,
            'show_vote_counts' => true,
            'competition_mode' => true,
        ]),
        'created_at' => current_time('mysql'),
    ];

    $festival_id = Peanut_Festival_Database::insert('festivals', $festival_data);
    $results['festival'] = $festival_id;
    echo "  Created festival ID: {$festival_id}\n\n";

    // =========================================================================
    // 2. CREATE VENUES
    // =========================================================================
    echo "Creating venues...\n";

    $venues = [
        [
            'name' => 'DiRasa House of Diversified Arts',
            'slug' => 'dirasa-house',
            'address' => '4 Lackawanna Plaza',
            'city' => 'Montclair',
            'state' => 'NJ',
            'zip' => '07042',
            'capacity' => 100,
            'venue_type' => 'theater',
        ],
        [
            'name' => "Just Jake's",
            'slug' => 'just-jakes',
            'address' => '30 Park Street',
            'city' => 'Montclair',
            'state' => 'NJ',
            'zip' => '07042',
            'capacity' => 75,
            'venue_type' => 'bar',
        ],
        [
            'name' => 'The Space',
            'slug' => 'the-space',
            'address' => '356 Bloomfield Avenue',
            'city' => 'Montclair',
            'state' => 'NJ',
            'zip' => '07042',
            'capacity' => 80,
            'venue_type' => 'theater',
        ],
        [
            'name' => 'NJ School of Dramatic Arts',
            'slug' => 'nj-dramatic-arts',
            'address' => '55 Montclair Avenue',
            'city' => 'Montclair',
            'state' => 'NJ',
            'zip' => '07042',
            'capacity' => 60,
            'venue_type' => 'theater',
        ],
    ];

    $venue_ids = [];
    foreach ($venues as $venue) {
        $venue['festival_id'] = $festival_id;
        $venue['created_at'] = current_time('mysql');
        $id = Peanut_Festival_Database::insert('venues', $venue);
        $venue_ids[$venue['slug']] = $id;
        $results['venues'][] = $venue['name'];
        echo "  Created venue: {$venue['name']} (ID: {$id})\n";
    }
    echo "\n";

    // =========================================================================
    // 3. CREATE PERFORMERS
    // =========================================================================
    echo "Creating performers...\n";

    $performers = [
        // THE BIG SHOW performers
        [
            'name' => 'Jenny Napolitano',
            'email' => 'jenny.napolitano@example.com',
            'bio' => 'Jenny Napolitano is a DC-based comedian, writer, and storyteller who turns overthinking into punchlines. She\'s a Moth GrandSlam champion and has performed at comedy festivals across the country.',
            'photo_url' => 'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F1151949293%2F2915069957191%2F1%2Foriginal.20251013-161901?w=512&auto=format,compress',
            'performance_type' => 'standup',
            'social_links' => json_encode([
                'instagram' => 'https://www.instagram.com/jennyisproudofyou',
                'youtube' => 'https://www.youtube.com/@jennifernapolitano7858',
            ]),
        ],
        [
            'name' => 'J-L Cauvin',
            'email' => 'jl.cauvin@example.com',
            'bio' => 'J-L Cauvin is a veteran stand-up comedian who\'s been on The Late Late Show, The Adam Carolla Show, Howard Stern, ESPN Radio, WTF with Marc Maron, Comics Unleashed, and Billions (Showtime). He is also a well-known impersonator with over 50 million views on social media.',
            'photo_url' => 'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F1151951403%2F2915069957191%2F1%2Foriginal.20251013-162050?w=512&auto=format,compress',
            'performance_type' => 'standup',
            'social_links' => json_encode([
                'youtube' => 'https://www.youtube.com/watch?v=nfv2lvFKiCk',
                'website' => 'https://www.primevideo.com/detail/J-L-Cauvin-Half-Blackface/0QQLNKNRO7W22VPG9MSKTHBXDZ',
            ]),
        ],
        [
            'name' => 'Natty Bumpercar',
            'email' => 'natty@nattybumpercar.com',
            'bio' => 'Natty Bumpercar has been doing comedy for a million years. He works clean, has tons of energy, loves audience engagement, and ensures everyone has fun at shows. He produces cartoons, webcomics, and hosts a podcast (Bumperpodcast).',
            'photo_url' => 'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F1151952923%2F2915069957191%2F1%2Foriginal.20251013-162224?w=512&auto=format,compress',
            'performance_type' => 'standup',
            'social_links' => json_encode([
                'website' => 'https://nattybumpercar.com/',
                'instagram' => 'https://www.instagram.com/nattybumpercar/',
            ]),
        ],

        // SEVEN-ATE-NINE performers
        [
            'name' => 'James Tanford',
            'email' => 'james.tanford@example.com',
            'bio' => 'New York-based stand-up comic whose vulnerable and self-effacing stories cover everything from his wealthy childhood to his rec league basketball team. Featured in New York Times for viral "My Apartment from Hell" and Vice documentary "Comedy Star Search".',
            'photo_url' => 'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F1151936973%2F2915069957191%2F1%2Foriginal.20251013-160607?w=512&auto=format,compress',
            'performance_type' => 'standup',
            'social_links' => json_encode(['instagram' => 'https://www.instagram.com/jamestanford']),
        ],
        [
            'name' => 'Kyle Mara',
            'email' => 'kyle.mara@example.com',
            'bio' => 'Stand-up comedian & filmmaker originally from Rockville Centre, NY. His debut album "Jokes on the Upper East Side" can be heard on SiriusXM and YouTube.',
            'photo_url' => 'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F1151939563%2F2915069957191%2F1%2Foriginal.20251013-160844?w=512&auto=format,compress',
            'performance_type' => 'standup',
            'social_links' => json_encode(['instagram' => 'https://www.instagram.com/kylemara']),
        ],
        [
            'name' => 'Nora Jeffries',
            'email' => 'nora.jeffries@example.com',
            'bio' => 'Queer comedian based in Brooklyn. Hosts the monthly standup showcase Regular Thing, and performs in festivals including San Francisco Sketchfest and Bergamot Comedy Festival.',
            'photo_url' => 'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F1151940903%2F2915069957191%2F1%2Foriginal.20251013-161004?w=512&auto=format,compress',
            'performance_type' => 'standup',
            'social_links' => json_encode([
                'website' => 'https://norajeffries.com',
                'instagram' => 'https://www.instagram.com/itjora',
            ]),
        ],
        [
            'name' => 'Kat Holmes',
            'email' => 'kat.holmes@example.com',
            'bio' => 'Award-winning Jersey comedian with sharp wit and real-life humor who has opened for DL Hughley.',
            'photo_url' => 'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F1151943533%2F2915069957191%2F1%2Foriginal.20251013-161234?w=512&auto=format,compress',
            'performance_type' => 'standup',
            'social_links' => json_encode(['instagram' => 'https://www.instagram.com/KatBeJoking']),
        ],
        [
            'name' => 'Tom Brennan',
            'email' => 'tom.brennan@example.com',
            'bio' => 'Emmy-nominated producer, writer and comedian. Created content for Marvel Comics, Disney, and NYC Mayor\'s Office.',
            'photo_url' => 'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F1151944843%2F2915069957191%2F1%2Foriginal.20251013-161404?w=512&auto=format,compress',
            'performance_type' => 'standup',
            'social_links' => json_encode([
                'website' => 'https://tombrennan.journoportfolio.com',
                'instagram' => 'https://www.instagram.com/brennanatorgram',
            ]),
        ],
        [
            'name' => 'Stone and Stone',
            'email' => 'stoneandstone@example.com',
            'bio' => 'Twin brothers/comedians Todd and Adam Stone. Semi-finalists on NBC\'s "Last Comic Standing" and co-creators of award-winning series "Going Both Ways."',
            'photo_url' => 'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F1159674463%2F2915069957191%2F1%2Foriginal.20251022-142641?w=512&auto=format,compress',
            'performance_type' => 'standup',
            'social_links' => json_encode([
                'instagram' => 'https://www.instagram.com/stoneandstone',
                'tiktok' => 'https://www.tiktok.com/@stoneandstonecomedy',
            ]),
        ],

        // SPOTLIGHT SHOWCASE performers
        [
            'name' => 'Sibo',
            'email' => 'sibo@example.com',
            'bio' => 'Sibo is a comic out of Maplewood, NJ, where she recently was a finalist in the 2024 Ladies of Laughter Competition and later a runner up in the 2025 Black Women in Comedy Laff Fest in NYC. When she\'s not performing, she\'s gentle parenting TF out of her 3 children.',
            'photo_url' => 'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F1151922713%2F2915069957191%2F1%2Foriginal.20251013-155236?w=512&auto=format,compress',
            'performance_type' => 'standup',
            'social_links' => json_encode([
                'youtube' => 'https://youtube.com/@siboisfunny',
                'instagram' => 'https://www.instagram.com/siboisfunny',
            ]),
        ],
        [
            'name' => 'Mollie Sperduto',
            'email' => 'mollie.sperduto@example.com',
            'bio' => 'Mollie Sperduto enjoys sharing details and stories of her life - unusual, but somehow relatable - at shows all around the Northeast! She has appeared at the Good Karma Comedy Festival, and was a finalist in the Tropicana Comedy Competition in Atlantic City.',
            'photo_url' => 'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F1151923913%2F2915069957191%2F1%2Foriginal.20251013-155352?w=512&auto=format,compress',
            'performance_type' => 'standup',
            'social_links' => json_encode(['website' => 'https://www.molliesperduto.com']),
        ],

        // HOT OUT OF THE GATE performers
        [
            'name' => 'Chelsea Moroski',
            'email' => 'chelsea.moroski@example.com',
            'bio' => 'Chelsea Moroski is a comic who has been terrorizing New Jersey for an unknown amount of time. She is a shy adult.',
            'photo_url' => 'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F1151259093%2F2915069957191%2F1%2Foriginal.20251012-190109?w=512&auto=format,compress',
            'performance_type' => 'standup',
            'social_links' => json_encode(['instagram' => 'https://www.instagram.com/chelseamoroski']),
        ],
        [
            'name' => 'Bob Grundfest',
            'email' => 'bob.grundfest@example.com',
            'bio' => 'Veteran performer active since the 1980s; performed with Robin Williams and appeared in a Billy Joel music video.',
            'photo_url' => 'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F1151262483%2F2915069957191%2F1%2Foriginal.20251012-190731?w=512&auto=format,compress',
            'performance_type' => 'standup',
            'social_links' => json_encode([
                'facebook' => 'https://www.facebook.com/bob.grundfest',
                'instagram' => 'https://www.instagram.com/bobgrundfest',
            ]),
        ],
        [
            'name' => 'Chris Pruneau',
            'email' => 'chris.pruneau@example.com',
            'bio' => 'Bloomfield-based comedian known for laid-back charm; hosts weekly open mic in Montclair.',
            'photo_url' => 'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F1151264893%2F2915069957191%2F1%2Foriginal.20251012-191220?w=512&auto=format,compress',
            'performance_type' => 'standup',
            'social_links' => json_encode(['instagram' => 'https://www.instagram.com/fatmandanish']),
        ],
        [
            'name' => 'Jerry Morrison',
            'email' => 'jerry.morrison@example.com',
            'bio' => 'Former touring rock bassist with Bleach; performs story-driven stand-up.',
            'photo_url' => 'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F1151266043%2F2915069957191%2F1%2Foriginal.20251012-191427?w=512&auto=format,compress',
            'performance_type' => 'standup',
            'social_links' => json_encode([
                'website' => 'https://jerrymorrison.me',
                'instagram' => 'https://www.instagram.com/jerrymorrison',
            ]),
        ],
        [
            'name' => 'Bobby Parker',
            'email' => 'bobby.parker@example.com',
            'bio' => 'Comedian, actor, and podcaster from Jacksonville, Florida.',
            'photo_url' => 'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F1151267193%2F2915069957191%2F1%2Foriginal.20251012-191651?w=512&auto=format,compress',
            'performance_type' => 'standup',
            'social_links' => json_encode(['instagram' => 'https://www.instagram.com/bobbyparkercomedy']),
        ],
        [
            'name' => 'Violet Lazarus',
            'email' => 'violet.lazarus@example.com',
            'bio' => 'Brooklyn-based comedian from North Jersey; half of Garden State comedy duo.',
            'photo_url' => 'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F1155784593%2F2915069957191%2F1%2Foriginal.20251017-111925?w=512&auto=format,compress',
            'performance_type' => 'standup',
            'social_links' => json_encode([
                'instagram' => 'https://www.instagram.com/violetlaz',
                'tiktok' => 'https://www.tiktok.com/@miss_ritaroom',
            ]),
        ],

        // ALL MIXED UP VARIETY performers
        [
            'name' => 'Joan Weisblatt',
            'email' => 'joan.weisblatt@example.com',
            'bio' => 'Joan Weisblatt was a lawyer, wife, mother, stand up comedian and now is a storyteller.',
            'photo_url' => 'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F1151679943%2F2915069957191%2F1%2Foriginal.20251013-111216?w=512&auto=format,compress',
            'performance_type' => 'storytelling',
            'social_links' => json_encode(['instagram' => 'https://www.instagram.com/jojobalonie']),
        ],
        [
            'name' => 'Johnny Tremendous',
            'email' => 'johnny.tremendous@example.com',
            'bio' => 'Extremely fun and lighthearted, with nary a serious bone in his body, Mr. Tremendous has been bringing his "living room" style of comedy and song to sold out crowds at NYC and New Jersey since 2002.',
            'photo_url' => 'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F1151681003%2F2915069957191%2F1%2Foriginal.20251013-111406?w=512&auto=format,compress',
            'performance_type' => 'musical',
            'social_links' => json_encode(['website' => 'https://www.johnnytremendous.net']),
        ],
        [
            'name' => 'Ventson',
            'email' => 'ventson@example.com',
            'bio' => 'Together, this improv duo performs with the power of one human brain. Allyson & Brent are: Ventson.',
            'photo_url' => 'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F1151682683%2F2915069957191%2F1%2Foriginal.20251013-111624?w=512&auto=format,compress',
            'performance_type' => 'improv',
            'social_links' => json_encode(['instagram' => 'https://www.instagram.com/bagheera_in_brooklyn']),
        ],
        [
            'name' => 'Kento',
            'email' => 'kento@example.com',
            'bio' => 'Kento is a clown and actor based in New York City! You might catch his voice on Marty Supreme (A24), see him on stage at Woolly Mammoth, and do comedy all around the world.',
            'photo_url' => 'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F1152210983%2F2915069957191%2F1%2Foriginal.20251013-203958?w=512&auto=format,compress',
            'performance_type' => 'clown',
            'social_links' => json_encode([
                'instagram' => 'https://www.instagram.com/kento.nyc',
                'website' => 'https://beacons.ai/kentomorita',
            ]),
        ],

        // FUN FRIDAY performers
        [
            'name' => 'Darin Patterson',
            'email' => 'darin.patterson@example.com',
            'bio' => 'Stand-up comedian, writer, and proud Queens, New York native who\'s performed at Derby City, Boston, and Park Slope festivals; co-hosts SNL Nerds podcast.',
            'photo_url' => 'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F1151886303%2F2915069957191%2F1%2Foriginal.20251013-151627?w=512&auto=format,compress',
            'performance_type' => 'standup',
            'social_links' => json_encode([
                'website' => 'https://non-productive.com/snlnerds/',
                'instagram' => 'https://www.instagram.com/Darincredible',
            ]),
        ],
        [
            'name' => 'Ty Raney',
            'email' => 'ty.raney@example.com',
            'bio' => 'Comedian from New Jersey featured on Kevin Hart\'s "Hart of the City" on Comedy Central.',
            'photo_url' => 'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F1151910573%2F2915069957191%2F1%2Foriginal.20251013-154041?w=512&auto=format,compress',
            'performance_type' => 'standup',
            'social_links' => json_encode([
                'youtube' => 'https://www.youtube.com/@ComedianTyRaney',
                'instagram' => 'https://www.instagram.com/ComedianTyRaney',
            ]),
        ],
        [
            'name' => 'Tim Rager',
            'email' => 'tim.rager@example.com',
            'bio' => 'Quick, quirky, dark, and funny performer; opened for Joey Diaz, Jim Norton, and Bobby Kelly.',
            'photo_url' => 'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F1151888763%2F2915069957191%2F1%2Foriginal.20251013-151849?w=512&auto=format,compress',
            'performance_type' => 'standup',
            'social_links' => json_encode([
                'website' => 'https://linktr.ee/timothyrager',
                'instagram' => 'https://www.instagram.com/timothyrager',
            ]),
        ],
        [
            'name' => 'Mike Stanley',
            'email' => 'mike.stanley@example.com',
            'bio' => 'Navigates the world as he sees fit with commentary on American culture and race.',
            'photo_url' => 'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F1151904773%2F2915069957191%2F1%2Foriginal.20251013-153408?w=512&auto=format,compress',
            'performance_type' => 'standup',
            'social_links' => json_encode([
                'website' => 'https://linktr.ee/lightskindmike',
                'instagram' => 'https://www.instagram.com/lightskinmikecomedy',
            ]),
        ],
        [
            'name' => 'Joanne Ashe',
            'email' => 'joanne.ashe@example.com',
            'bio' => 'Mother, grandmother, great-grandmother, special-ed teacher, ex-wife who handles tough crowds her whole life.',
            'photo_url' => 'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F1151908063%2F2915069957191%2F1%2Foriginal.20251013-153740?w=512&auto=format,compress',
            'performance_type' => 'standup',
            'social_links' => json_encode([
                'instagram' => 'https://www.instagram.com/jokingly_joanne',
                'tiktok' => 'https://www.tiktok.com/@joanneashe2',
            ]),
        ],
        [
            'name' => 'Paige Smith-Hogan',
            'email' => 'paige.smithhogan@example.com',
            'bio' => 'Comedian and middle school teacher based in Brooklyn; featured in New York Comedy Festival.',
            'photo_url' => 'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F1155803663%2F2915069957191%2F1%2Foriginal.20251017-115153?w=512&auto=format,compress',
            'performance_type' => 'standup',
            'social_links' => json_encode(['instagram' => 'https://www.instagram.com/paigemode']),
        ],
        [
            'name' => 'Suzanne Linfante',
            'email' => 'suzanne.linfante@example.com',
            'bio' => 'Performs throughout NJ & NY including Basement at Tommy\'s and Rhino Comedy; Law & Order SVU guest.',
            'photo_url' => 'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F1155799283%2F2915069957191%2F1%2Foriginal.20251017-114414?w=512&auto=format,compress',
            'performance_type' => 'standup',
            'social_links' => json_encode(['instagram' => 'https://www.instagram.com/suzzzcomedy/']),
        ],

        // Additional performers
        [
            'name' => 'Zack Slaff',
            'email' => 'zack.slaff@example.com',
            'bio' => 'New Jersey native performing stand-up for three years; co-producer of The Zack & Ro Show.',
            'photo_url' => 'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F1151263333%2F2915069957191%2F1%2Foriginal.20251012-190924?w=512&auto=format,compress',
            'performance_type' => 'standup',
            'social_links' => json_encode([
                'instagram' => 'https://www.instagram.com/zackslaffcomedy',
                'tiktok' => 'https://www.tiktok.com/@zslaff',
            ]),
        ],
        [
            'name' => 'Adam D. Shandler',
            'email' => 'adam.shandler@example.com',
            'bio' => 'Observational comedian performing at clubs, festivals, and private venues nationwide and internationally.',
            'photo_url' => 'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F1151268223%2F2915069957191%2F1%2Foriginal.20251012-191838?w=512&auto=format,compress',
            'performance_type' => 'standup',
            'social_links' => json_encode([
                'website' => 'https://adamspeaking.works',
                'instagram' => 'https://www.instagram.com/adam.d.here',
            ]),
        ],
        [
            'name' => 'Barbie Lazaro',
            'email' => 'barbie.lazaro@example.com',
            'bio' => 'South Florida comedian performing since 2023; performs nationally and internationally.',
            'photo_url' => 'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F1155786703%2F2915069957191%2F1%2Foriginal.20251017-112222?w=512&auto=format,compress',
            'performance_type' => 'standup',
            'social_links' => json_encode(['instagram' => 'https://www.instagram.com/barbieunkorked']),
        ],
        [
            'name' => 'Brian Rabadeau',
            'email' => 'brian.rabadeau@example.com',
            'bio' => 'Tri-state performer for nearly ten years; performed in New Orleans and Tokyo.',
            'photo_url' => 'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F1155789283%2F2915069957191%2F1%2Foriginal.20251017-112515?w=512&auto=format,compress',
            'performance_type' => 'standup',
            'social_links' => json_encode([
                'instagram' => 'https://www.instagram.com/brabs91',
                'tiktok' => 'https://www.tiktok.com/@rabiddogcomedy',
            ]),
        ],
    ];

    $performer_ids = [];
    foreach ($performers as $performer) {
        $performer['festival_id'] = $festival_id;
        $performer['application_status'] = 'accepted';
        $performer['created_at'] = current_time('mysql');

        // Check if performer already exists by email
        $existing = Peanut_Festival_Database::get_row('performers', ['email' => $performer['email']]);
        if ($existing) {
            $performer_ids[$performer['name']] = $existing->id;
            echo "  Skipped (exists): {$performer['name']}\n";
            continue;
        }

        $id = Peanut_Festival_Database::insert('performers', $performer);
        $performer_ids[$performer['name']] = $id;
        $results['performers'][] = $performer['name'];
        echo "  Created performer: {$performer['name']} (ID: {$id})\n";
    }
    echo "\n";

    // =========================================================================
    // 4. CREATE SHOWS
    // =========================================================================
    echo "Creating shows...\n";

    $shows = [
        [
            'title' => 'Hot Out of the Gate Stand-Up Competition',
            'slug' => 'hot-out-of-the-gate',
            'description' => 'Live, fresh, and totally hilarious stand-up competition format. New comics compete for audience approval!',
            'show_date' => '2025-11-13',
            'start_time' => '19:00:00',
            'end_time' => '20:30:00',
            'venue_slug' => 'dirasa-house',
            'performers' => ['Chelsea Moroski', 'Bob Grundfest', 'Chris Pruneau', 'Jerry Morrison', 'Bobby Parker', 'Violet Lazarus', 'Zack Slaff', 'Adam D. Shandler', 'Barbie Lazaro', 'Brian Rabadeau'],
        ],
        [
            'title' => 'After Bedtime O\'clock Stand-Up Comedy Show',
            'slug' => 'after-bedtime-oclock',
            'description' => 'Late night laughs at Just Jake\'s. The kids are in bed, time for adult comedy!',
            'show_date' => '2025-11-13',
            'start_time' => '20:30:00',
            'end_time' => '21:45:00',
            'venue_slug' => 'just-jakes',
            'performers' => ['Natty Bumpercar', 'Sibo', 'Tim Rager'],
        ],
        [
            'title' => 'All Mixed Up Variety Show',
            'slug' => 'all-mixed-up',
            'description' => 'Story-telling, singing, improv, sketch, and surprises. A little bit of everything!',
            'show_date' => '2025-11-14',
            'start_time' => '18:30:00',
            'end_time' => '20:00:00',
            'venue_slug' => 'the-space',
            'performers' => ['Joan Weisblatt', 'Johnny Tremendous', 'Ventson', 'J-L Cauvin', 'Kento'],
        ],
        [
            'title' => 'Yip! Yep! Yup! Improv Showcase',
            'slug' => 'yip-yep-yup',
            'description' => 'High-energy improv from the best teams in the tri-state area.',
            'show_date' => '2025-11-14',
            'start_time' => '20:00:00',
            'end_time' => '21:30:00',
            'venue_slug' => 'nj-dramatic-arts',
            'performers' => ['Ventson'],
        ],
        [
            'title' => 'FUN Friday Stand-Up Comedy Competition',
            'slug' => 'fun-friday-competition',
            'description' => 'Comics perform five-minute sets; judges select one winner for the headlining show!',
            'show_date' => '2025-11-14',
            'start_time' => '20:15:00',
            'end_time' => '21:45:00',
            'venue_slug' => 'the-space',
            'performers' => ['Darin Patterson', 'Ty Raney', 'Tim Rager', 'Mike Stanley', 'Joanne Ashe', 'Paige Smith-Hogan', 'Suzanne Linfante'],
        ],
        [
            'title' => 'Spotlight Showcase Stand-Up Show',
            'slug' => 'spotlight-showcase',
            'description' => 'Host, featured comics, a guest spot, and a HEADLINER. The cream of the crop!',
            'show_date' => '2025-11-14',
            'start_time' => '22:15:00',
            'end_time' => '23:30:00',
            'venue_slug' => 'the-space',
            'performers' => ['Sibo', 'Mollie Sperduto', 'J-L Cauvin'],
        ],
        [
            'title' => 'The Sparkle & Smile Show (Family Friendly)',
            'slug' => 'sparkle-smile',
            'description' => 'Improv from NJ School of Dramatic Arts plus mystery improv piece. Fun for the whole family!',
            'show_date' => '2025-11-15',
            'start_time' => '11:00:00',
            'end_time' => '12:00:00',
            'venue_slug' => 'dirasa-house',
            'kid_friendly' => 1,
            'performers' => ['Natty Bumpercar'],
        ],
        [
            'title' => 'The Lucky Guess Game Show (Family Friendly)',
            'slug' => 'lucky-guess',
            'description' => 'Interactive game show fun hosted by Ron MacClasky. Prizes and laughs for everyone!',
            'show_date' => '2025-11-15',
            'start_time' => '12:30:00',
            'end_time' => '13:30:00',
            'venue_slug' => 'dirasa-house',
            'kid_friendly' => 1,
            'performers' => [],
        ],
        [
            'title' => 'Bits & Pieces Improv Showcase',
            'slug' => 'bits-pieces',
            'description' => 'High-energy improv from multiple groups, fast, ferocious and funny!',
            'show_date' => '2025-11-15',
            'start_time' => '17:00:00',
            'end_time' => '18:30:00',
            'venue_slug' => 'dirasa-house',
            'performers' => ['Ventson', 'Kento'],
        ],
        [
            'title' => 'Seven-Ate-Nine Stand-Up Comedy Show',
            'slug' => 'seven-ate-nine',
            'description' => 'Host performs seven minutes; eight comics perform nine minutes each. Pure stand-up excellence!',
            'show_date' => '2025-11-15',
            'start_time' => '19:00:00',
            'end_time' => '20:30:00',
            'venue_slug' => 'dirasa-house',
            'featured' => 1,
            'performers' => ['James Tanford', 'Kyle Mara', 'Nora Jeffries', 'Kat Holmes', 'Tom Brennan', 'Stone and Stone'],
        ],
        [
            'title' => 'The BIG Show - Stand-Up Comedy',
            'slug' => 'the-big-show',
            'description' => 'Festival favorites take the stage to end the festival with BIG laughs! The grand finale!',
            'show_date' => '2025-11-15',
            'start_time' => '21:00:00',
            'end_time' => '22:15:00',
            'venue_slug' => 'dirasa-house',
            'featured' => 1,
            'performers' => ['Jenny Napolitano', 'J-L Cauvin', 'Natty Bumpercar', 'Stone and Stone', 'Ty Raney'],
        ],
    ];

    foreach ($shows as $show) {
        $show_performers = $show['performers'];
        unset($show['performers']);

        $show['festival_id'] = $festival_id;
        $show['venue_id'] = $venue_ids[$show['venue_slug']];
        unset($show['venue_slug']);
        $show['status'] = 'scheduled';
        $show['created_at'] = current_time('mysql');

        $show_id = Peanut_Festival_Database::insert('shows', $show);
        $results['shows'][] = $show['title'];
        echo "  Created show: {$show['title']} (ID: {$show_id})\n";

        // Assign performers to show
        $order = 1;
        foreach ($show_performers as $performer_name) {
            if (isset($performer_ids[$performer_name])) {
                Peanut_Festival_Database::insert('show_performers', [
                    'show_id' => $show_id,
                    'performer_id' => $performer_ids[$performer_name],
                    'slot_order' => $order++,
                    'set_length_minutes' => 9, // default 9 minutes
                    'confirmed' => 1,
                ]);
                $results['assignments']++;
            }
        }
    }

    echo "\n";
    echo "=========================================\n";
    echo "IMPORT COMPLETE!\n";
    echo "=========================================\n";
    echo "Festival ID: {$results['festival']}\n";
    echo "Venues created: " . count($results['venues']) . "\n";
    echo "Performers created: " . count($results['performers']) . "\n";
    echo "Shows created: " . count($results['shows']) . "\n";
    echo "Performer assignments: {$results['assignments']}\n";
    echo "\n";

    return $results;
}

// Run the import if this file is executed directly
if (defined('WP_CLI') || (defined('ABSPATH') && current_user_can('manage_options'))) {
    pf_import_montclair_festival();
}
