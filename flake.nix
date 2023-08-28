{
  description = "Ethereum network crawler, API, and frontend";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    devshell.url = "github:numtide/devshell";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, devshell, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [ devshell.overlays.default ];
        };
      in {
        packages = {
          crawler = pkgs.buildGoModule rec {
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
        };
        devShell = pkgs.devshell.mkShell {
          packages = with pkgs; [
            go
            gopls
            golangci-lint
            sqlite
          ];
        };
      });
}

