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

            src = ./crawler;

            vendorHash = "sha256-9gqQ8z/KVx+s+moVXUJ/o1PXfHPsskXeK5YsCGsO9Jc=";

            CGO_ENABLED = 0;

            ldflags = [ "-s" "-extldflags -static" ];
          };
        };
        devShell = pkgs.devshell.mkShell {
          packages = with pkgs; [
            go_1_21
            gopls
            golangci-lint
            sqlite
          ];
        };
      });
}

