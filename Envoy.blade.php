@setup
    include __DIR__.'/vendor/autoload.php';

    Dotenv\Dotenv::createImmutable(__DIR__)
        ->safeLoad();

    // Configuration
    $serverHost = trim($_ENV['ENVOY_SSH_HOST'] ?? '');
    $projectPath = rtrim(trim($_ENV['ENVOY_PROJECT_ROOT_PATH'] ?? ''), '/');
    $maintainerEmail = $_ENV['MAINTAINER_EMAIL'] ?? '';

    if ($serverHost === '' || $projectPath === '') {
        throw new Exception(
            'You must set non-empty ENVOY_SSH_HOST and ENVOY_PROJECT_ROOT_PATH'
        );
    }

    $localBuildPath = 'storage/app/deploy/dist.zip';
    $remoteTempDirectory = $projectPath.'/storage/app/deploy';
    $remoteTempPath = $remoteTempDirectory.'/dist.zip';
    $remoteBuildPath = $projectPath . '/public/build';
@endsetup

@servers([
    'production' => $serverHost,
    'localhost' => '127.0.0.1',
])

@story('deploy_be')
    pull_be
    install_be_deps
    optimize_be
    restart_queues
@endstory

@story('deploy_fe')
    prepare_remote_temp
    upload_fe
    unzip_fe
@endstory

@task('prepare_remote_temp', ['on' => 'production'])
    mkdir -p {{ $remoteTempDirectory }}
@endtask

@task('upload_fe', ['on' => 'localhost'])
    scp {{ $localBuildPath }} {{ $serverHost }}:{{ $remoteTempPath }}
@endtask

@task('unzip_fe', ['on' => 'production'])
    echo "Deploying frontend assets..."
    rm -rf {{ $remoteBuildPath }}
    mkdir -p {{ $remoteBuildPath }}
    unzip -o {{ $remoteTempPath }} -d {{ $remoteBuildPath }}
    rm {{ $remoteTempPath }}
@endtask

@task('pull_be', ['on' => 'production'])
    echo "Pulling latest changes..."
    cd {{ $projectPath }}
    git pull origin HEAD
@endtask

@task('install_be_deps', ['on' => 'production'])
    echo "Installing composer dependencies..."
    cd {{ $projectPath }}
    composer install --optimize-autoloader --no-dev
@endtask

@task('clear_cache', ['on' => 'production'])
    cd {{ $projectPath }}

    echo "Clearing application cache..."

    php artisan optimize:clear

    echo "Optimizing application cache..."

    php artisan optimize
@endtask

@task('optimize_be', ['on' => 'production'])
    echo "Optimizing application cache..."
    cd {{ $projectPath }}

    php artisan optimize
@endtask

@task('restart_queues', ['on' => 'production'])
    echo "Restarting queues..."
    cd {{ $projectPath }}
    php artisan queue:restart
@endtask

@task('check_health', ['on' => 'production'])
    echo "Running health check..."
    cd {{ $projectPath }}
    php artisan app:health-check --mail={{ $maintainerEmail }}
@endtask
