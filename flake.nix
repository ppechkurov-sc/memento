{
  description = "Memento flake development environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      utils,
    }:
    utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      with pkgs;
      {
        devShells = {
          default = mkShell {
            # The Nix packages provided in the environment
            packages = [
              gnumake
              jq
              nodejs_24
kitty
              (presenterm.overrideAttrs (oldAttrs: {
                nativeBuildInputs = (oldAttrs.nativeBuildInputs or [ ]) ++ [ pkg-config ];
                buildInputs = (oldAttrs.buildInputs or [ ]) ++ [ oniguruma ];
              }))
            ];
          };
        };
      }
    );
}
