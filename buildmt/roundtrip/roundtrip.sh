# To run the MASL round trip regression.
# Install the latest BridgePoint (from S3).
# Refresh repo and launch regression in the background without hang-up.

echo "Starting round trip."
cd /build/buildmt/roundtrip
if [ -d BridgePoint ]; then
  echo "...removing stale BridgePoint."
  rm -rf BridgePoint
fi
# Use the following to get BridgePoint from S3.
#./install-bp.sh
echo "...unzipping last Successful BridgePoint."
unzip -q ../hudson-home/jobs/BridgePoint/lastSuccessful/archive/bridgepoint/releng/org.xtuml.bp.releng.parent.product/target/products/org.xtuml.bp.product-linux.gtk.x86_64.zip
if [ -d results ]; then
  echo "Removing stale results"
  rm -rf results
fi
if [ -d models ]; then
  echo "...refreshing the models repository."
  cd models/masl/test
  git pull origin master
else
  echo "...cloning the models repository."
  git clone https://github.com/xtuml/models.git --branch master --depth 1
  cd models/masl/test
fi
echo "...running the regression_test."
xvfb-run ./regression_test -o ../../../results < all_tests
cd ../../..
echo "...removing BridgePoint installation."
rm -rf BridgePoint
echo "Round trip complete."
