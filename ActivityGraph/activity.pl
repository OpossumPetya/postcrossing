#!/usr/bin/perl

use v5.18;
use strict;
use warnings;
use Data::Dumper;

use DateTime;
use JSON::XS;
use File::Spec;
use File::Basename 'dirname';
use Mojolicious::Lite;
use POSIX qw/strftime/;
use HTTP::Cookies;
use WWW::Mechanize; # requires LWP::Protocol::https for "https" connections


my $username = 'username';
my $password = 'password';

my %CARDINFO = (
    # ["RU-3605903","Brest",0,"BY",1428046956,1428762222,963,8,0]       - Sent card
    # ["AU-419773","misosoup",0,"AU",1430138841,1433792321,14909,42,1]  - Received card
    id              => 0,   # postcrossing card id
    user            => 1,   # for sent card -- "to" user, for received cards -- "from" user
    reserved        => 2,   # I just don't know what this is, so its "reserved"
    country         => 3,   # for sent card -- "to" country, for received cards -- "from" country
    sent_time       => 4,   # unix timestamp
    received_time   => 5,   # unix timestamp
    distance        => 6,   # distance traveled in km
    days            => 7,   # days traveled
    has_image       => 8,   # has image uploaded
);

#=============================================================================

sub trim { my $s = shift; $s =~ s/^\s+|\s+$//g; return $s };

sub generate_svg {
    
    my $cards = shift;  # ref to hash { 'YYYY-MM-DD' => n }
    my $SVG_HTML = '';  # return string
    
    my $today = DateTime->today(time_zone => 'GMT', locale => "en_US"); # 'local', 'Europe/Lisbon'
    my $start = $today->clone->subtract(years => 1);
    
    my $rect_width  = 11;       # in px
    my $rect_height = 11;
    my $spacing_horizontal = 2; # in px
    my $spacing_vertical   = 2;
    
    my @months_offsets;
    
    my ($x, $y) = (0, 0);
    my $week = 0;
    
    my $h_shift = $rect_width + $spacing_horizontal;
    my $v_shift = $rect_height + $spacing_vertical;
    
    
    # start SVG
    $SVG_HTML .= "<svg width='721' height='110'>\n";
    $SVG_HTML .= "<g transform='translate(20, 20)'>\n";
    
    
    $SVG_HTML .= "<g transform='translate(0, 0)'>\n";
    while ( $start->add(days => 1) <= $today ) {
        
        my $hOffset = $h_shift * $week;
        my $vOffset = $v_shift * ($start->day_of_week() - 1);
        my $color = '#eeeeee';
        if (defined $cards->{$start->ymd('-')}) {
            $color = $cards->{$start->ymd('-')} == 3 ? '#1e6823' : '#8cc665';
        }
    
        push @months_offsets, [ $hOffset, $start->month_abbr() ] if $start->day() == 1;
    
        $SVG_HTML .= "<g transform='translate($hOffset, 0)'>\n" if $start->day_of_week() == 1 and $week != 0;
        $SVG_HTML .= "\t<rect width='$rect_width' height='$rect_height' y='$vOffset' fill='$color' data-date='".$start->ymd('-')."'/>\n";
        if ($start->day_of_week() == 7) {
            $SVG_HTML .= "</g>\n";
            $week++;
        }
    }
    $SVG_HTML .= "</g>\n" if $start->day_of_week() != 1;   # it wasn't printed inside the loop
    
    # months
    $SVG_HTML .= "<text x='$_->[0]' y='-5' class='month'>$_->[1]</text>\n" for @months_offsets;
    
    # weekdays & finish SVG
    $SVG_HTML .= << "SVG";
<text text-anchor='middle' class='wday' dx='-10' dy='9'>M</text>
<text text-anchor='middle' class='wday' dx='-10' dy='22' style='display: none;'>T</text>
<text text-anchor='middle' class='wday' dx='-10' dy='35'>W</text>
<text text-anchor='middle' class='wday' dx='-10' dy='48' style='display: none;'>T</text>
<text text-anchor='middle' class='wday' dx='-10' dy='61'>F</text>
<text text-anchor='middle' class='wday' dx='-10' dy='74' style='display: none;'>S</text>
<text text-anchor='middle' class='wday' dx='-10' dy='87'>S</text>
</g>
</svg>
SVG
    
    return $SVG_HTML;
}

#=============================================================================

get '/u/:username' => sub {
    my $c = shift;
    my $USER = trim($c->stash('username'));
    
    app->log->info("-- User $USER requested! ----------");


    # set up agent
    my $cookie_jar = HTTP::Cookies->new(
        file => File::Spec->rel2abs(dirname($0)) . "/lwp_cookies.txt",
        autosave => 1,
    );
    
    my $agent = WWW::Mechanize->new(
        agent => 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.106 Safari/537.36', # Chrome 47 on Win10 x64
        cookie_jar => $cookie_jar,
    );

    

    
    #== GET Sent CARDS ================================================
    # if we get HTML response -- we need to login
    # if JSON -- we've got what we want
    
    app->log->info("\tGetting sent cards");
    
    $agent->add_header('Accept'             => 'application/json, text/javascript, */*; q=0.01');
    $agent->add_header('Accept-Encoding'    => 'gzip, deflate, sdch');
    $agent->add_header('Referer'            => 'https://www.postcrossing.com/');
    $agent->add_header('X-Requested-With'   => 'XMLHttpRequest');
    
    my $response = $agent->get( "https://www.postcrossing.com/user/$USER/data/sent");
    #die $response->status_line unless $response->is_success;
    
    if ($response->header('Content-Type') !~ /json/) {
        app->log->info("\tFirst attempt - not JSON. Logging in.");
        
        # let's login
        $agent->delete_header('Accept');
        $agent->delete_header('Accept-Encoding');
        $agent->delete_header('Referer');
        $agent->delete_header('X-Requested-With');
    
        $agent->get( 'http://www.postcrossing.com' );
        
        $response = $agent->submit_form (
            form_number => 1,
            fields      => {
                'signin[username]' => $username,
                'signin[password]' => $password,
            }
        );
        
        app->log->info("\tSecond attempt to get sent cards");
        
        $agent->add_header('Accept'             => 'application/json, text/javascript, */*; q=0.01');
        $agent->add_header('Accept-Encoding'    => 'gzip, deflate, sdch');
        $agent->add_header('Referer'            => 'https://www.postcrossing.com/');
        $agent->add_header('X-Requested-With'   => 'XMLHttpRequest');
        
        $response = $agent->get( "https://www.postcrossing.com/user/$USER/data/sent");
        # if $response->header( 'Content-Type' ) is not JSON, error out
        # but for now we'll be optimistic
        
        app->log->info("\tSecond Response:".$response->header('Content-Type'));
    }
    
    my $sent_cards = decode_json $response->decoded_content;
    
    
    #== GET Received CARDS ============================================
    
    app->log->info("\tGetting received cards");
    
    $agent->add_header('Accept'             => 'application/json, text/javascript, */*; q=0.01');
    $agent->add_header('Accept-Encoding'    => 'gzip, deflate, sdch');
    $agent->add_header('Referer'            => 'https://www.postcrossing.com/');
    $agent->add_header('X-Requested-With'   => 'XMLHttpRequest');
    
    $response = $agent->get( "https://www.postcrossing.com/user/$USER/data/received");
    #die $response->status_line unless $response->is_success;
    #if ($response->header( 'Content-Type' ) !~ /json/) { } -- error out
    
    my $received_cards = decode_json $response->decoded_content;

    
    #== FIX DATA ======================================================

    my %user_activity; # format { 'YYYY-MM-DD' => n } where n = 1-sent; 2-received; 3-both

    # sent
    for my $card (@$sent_cards) {
        $user_activity{ strftime('%Y-%m-%d',gmtime( $card->[$CARDINFO{sent_time}] )) } = 1;    # 1 == sent
    }
    
    # received
    for my $card (@$received_cards) {
        my $ymd = strftime('%Y-%m-%d',gmtime( $card->[$CARDINFO{received_time}] ));
        if( defined $user_activity{$ymd} ){
            $user_activity{ $ymd } = 3 if $user_activity{$ymd} == 1;    # 1 == sent; 2 == received; 3 == sent and received
        }
        else {
            # not sent or received this day
            $user_activity{ $ymd } = 2; # 2 == received
        }
    }


    #== RENDER ========================================================

    $c->stash(title => "$USER Poscrossing Activity");
    $c->stash(pc_user => $USER);
    $c->stash(activity_svg => generate_svg( \%user_activity ));
    
    $c->render(template => 'index');
};


app->secrets(['pc activity app secret']);
app->config(hypnotoad => {listen => ['http://*:80']});

app->start;
