module.exports = {
    apps: [
      {
        name: 'my-api',
        script: './server.js',
        watch: false,
        ignore_watch: ['node_modules', 'utils'], // Corrigido para ignore_watch
        watch_options: {
          followSymlinks: false, // Certifique-se de que este campo está escrito corretamente
        },
        instances: '1',
        exec_mode: 'fork',
        post_start: 'cmd.exe /C del "C:\\Users\\matif\\Documents\\api Conf\\logs\\combined.log" & cmd.exe /C del "C:\\Users\\matif\\Documents\\api Conf\\logs\\error.log"',

      },
    ],
  };
  