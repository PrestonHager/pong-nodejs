{
  description = "A Nix-flake-based Node.js development environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      #let pkgs = nixpkgs.legacyPackages.${system}; in
      let pkgs = import nixpkgs {
        inherit system;
        config = {
          allowUnfree = true;
          cudaSupport = true;
        };
      }; in
      {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs_23
          ];

          shellHook = ''
            echo "Node.js version: $(node --version)"
            exec nu
          '';
        };
      }
    );
}

