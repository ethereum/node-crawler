{
  description = "Ethereum network crawler, API, and frontend";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    devshell.url = "github:numtide/devshell";
    flake-parts.url = "github:hercules-ci/flake-parts";
  };

  outputs = inputs@{ self, nixpkgs, devshell, flake-parts }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      imports = [
        devshell.flakeModule
        flake-parts.flakeModules.easyOverlay
      ];

      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];

      perSystem = { config, pkgs, final, ... }: {
        overlayAttrs = {
          inherit (config.packages) nodeCrawler;
          inherit (config.packages) nodeCrawlerFrontend;
        };

        packages = {
          nodeCrawler = pkgs.buildGo121Module rec {
            pname = "crawler";
            version = "0.0.0";

            src = ./.;
            subPackages = [ "cmd/crawler" ];

            vendorHash = "sha256-nR6YsXZvIUupDHGCgOYELDpJVbbPc1SPK9LdwnL5sAQ=";

            doCheck = false;

            CGO_ENABLED = 0;

            ldflags = [
              "-s"
              "-w"
              "-extldflags -static"
            ];
          };
          nodeCrawlerFrontend = pkgs.buildNpmPackage rec {
            pname = "frontend";
            version = "0.0.0";

            src = ./frontend;

            npmDepsHash = "sha256-1nLQVoNkiA4x97UcPe8rNMXa7bYCskazpJesWVLnDHk=";

            installPhase = ''
              mkdir -p $out/share
              cp -r build/ $out/share/frontend
            '';
          };
        };

        devshells.default = {
          packages = with pkgs; [
            go_1_21
            golangci-lint
            nodejs
            sqlite
          ];
        };
      };

      flake = rec {
        nixosModules.default = nixosModules.nodeCrawler;
        nixosModules.nodeCrawler = { config, lib, pkgs, ... }:
        with lib;
        let
          cfg = config.services.nodeCrawler;
          apiAddress = "${cfg.api.address}:${toString cfg.api.port}";
        in
        {
          options.services.nodeCrawler = {
            enable = mkEnableOption (self.flake.description);

            hostName = mkOption {
              type = types.str;
              default = "localhost";
              description = "Hostname to serve Node Crawler on.";
            };

            nginx = mkOption {
              type = types.attrs;
              default = { };
              example = literalExpression ''
                {
                  forceSSL = true;
                  enableACME = true;
                }
              '';
              description = "Extra configuration for the vhost. Useful for adding SSL settings.";
            };

            stateDir = mkOption {
              type = types.path;
              default = /var/lib/node_crawler;
              description = "Directory where the databases will exist.";
            };

            crawlerDatabaseName = mkOption {
              type = types.str;
              default = "crawler.db";
              description = "Name of the file within the `stateDir` for storing the data for the crawler.";
            };

            apiDatabaseName = mkOption {
              type = types.str;
              default = "api.db";
              description = "Name of the file within the `stateDir` for storing the data for the API.";
            };

            user = mkOption {
              type = types.str;
              default = "nodecrawler";
              description = "User account under which Node Crawler runs.";
            };

            group = mkOption {
              type = types.str;
              default = "nodecrawler";
              description = "Group account under which Node Crawler runs.";
            };

            dynamicUser = mkOption {
              type = types.bool;
              default = true;
              description = ''
                Runs the Node Crawler as a SystemD DynamicUser.
                It means SystenD will allocate the user at runtime, and enables
                some other security features.
                If you are not sure what this means, it's safe to leave it default.
              '';
            };

            api = {
              enable = mkOption {
                default = true;
                type = types.bool;
                description = "Enables the Node Crawler API server.";
              };

              address = mkOption {
                type = types.str;
                default = "127.0.0.1";
                description = "Listen address for the API server.";
              };

              port = mkOption {
                type = types.port;
                default = 10000;
                description = "Listen port for the API server.";
              };
            };

            crawler = {
              enable = mkOption {
                default = true;
                type = types.bool;
                description = "Enables the Node Crawler API server.";
              };

              geoipdb = mkOption {
                type = types.path;
                default = config.services.geoipupdate.settings.DatabaseDirectory + "/GeoLite2-Country.mmdb";
                description = ''
                  Location of the GeoIP database.

                  If the default is used, the `geoipupdate` service files.
                  So you will need to configure it.
                  Make sure to enable the `GeoLite2-Country` edition.

                  If you do not want to enable the `geoipupdate` service, then
                  the `GeoLite2-Country` file needs to be provided.
                '';
              };

              network = {
                type = types.str;
                default = "mainnet";
                example = "goerli";
                description = "Name of the network to crawl. Defaults to Mainnet.";
              };
            };
          };

          config = mkIf cfg.enable {
            systemd.services = {
              node-crawler-crawler = {
                description = "Node Cralwer, the Ethereum Node Crawler.";
                wantedBy = [ "multi-user.target" ];
                after = [ "network.target" ];

                serviceConfig = {
                  ExecStart =
                  let
                    args = [
                      "--crawler-db=${cfg.crawlerDatabaseName}"
                      "--geoipdb=${cfg.crawler.geoipdb}"
                    ]
                    ++ optional (cfg.crawler.network == "goerli") "--goerli"
                    ++ optional (cfg.crawler.network == "sepolia") "--sepolia";
                  in
                  "${pkgs.nodeCrawler}/bin/crawler crawl ${concatStringsSep " " args}";

                  WorkingDirectory = cfg.stateDir;
                  StateDirectory = optional (cfg.stateDir == /var/lib/node_crawler) "node_crawler";

                  DynamicUser = cfg.dynamicUser;
                  Group = cfg.group;
                  User = cfg.user;

                  Restart = "on-failure";
                };
              };
              node-crawler-api = {
                description = "Node Cralwer API, the API for the Ethereum Node Crawler.";
                wantedBy = [ "multi-user.target" ];
                after = [ "network.target" ]
                  ++ optional cfg.crawler.enable "node-crawler-crawler.service";

                serviceConfig = {
                  ExecStart =
                  let
                    args = [
                      "--addr=${apiAddress}"
                      "--crawler-db=${cfg.crawlerDatabaseName}"
                      "--api-db=${cfg.apiDatabaseName}"
                    ];
                  in
                  "${pkgs.nodeCrawler}/bin/crawler api ${concatStringsSep " " args}";

                  WorkingDirectory = cfg.stateDir;
                  StateDirectory = optional (cfg.stateDir == /var/lib/node_crawler) "node_crawler";

                  DynamicUser = cfg.dynamicUser;
                  Group = cfg.group;
                  User = cfg.user;

                  Restart = "on-failure";
                };
              };
            };

            services.nginx = {
              enable = true;
              upstreams.nodeCrawlerApi.servers."${apiAddress}" = { };
              virtualHosts."${cfg.hostName}" = mkMerge [
                cfg.nginx
                {
                  root = mkForce "${pkgs.nodeCrawlerFrontend}/share/frontend";
                  locations = {
                    "/" = {
                      index = "index.html";
                      tryFiles = "$uri $uri/ /index.html";
                    };
                    "/v1/" = {
                      proxyPass = "http://nodeCrawlerApi/v1/";
                    };
                  };
                }
              ];
            };
          };
        };
      };
  };
}
