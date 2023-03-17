import Layout from "@/components/Layout";
import Link from "next/link";
import OdemeDetails from "../components/OdemeDetails";
import { useDispatch, useSelector } from 'react-redux'
import { selectItems, selectTotal } from '../GlobalRedux/basket/basketSlice'
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import turkiye from "../lib/turkiye.json"
import IframeResizer from "iframe-resizer-react";
import nodeBase64 from 'nodejs-base64-converter';
import crypto from 'crypto';
import { useRouter } from "next/navigation";



function Odeme({ ip }) {
  const [tokenPay, setTokenPay] = useState("");

  const router = useRouter();
  // const dispatch = useDispatch()
  const [email, setEmail] = useState("");
  const [ad, setAd] = useState("");
  const [soyad, setSoyad] = useState("");
  const [tc, setTc] = useState(11111111111);
  const [vergiDaire, setVergiDaire] = useState("");
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [tel, setTel] = useState("");
  const [address, setAddress] = useState("");
  const [isPaid, setIsPaid] = useState(false)
  const [shippingPrice, setShippingPrice] = useState(100)
  const items = useSelector(selectItems);
  const total = Number(useSelector(selectTotal));
  const [checked, setChecked] = useState(false)
  const [checkedTeslimat, setCheckedTeslimat] = useState(false)

  useEffect(() => {
    async function fetchCities() {
      try {
        const response = turkiye.data.map(item => item.name)
        setCities(response);
      } catch (error) {
        console.error(error);
      }
    }
    fetchCities();
  }, []);

  useEffect(() => {
    async function fetchDistricts() {
      if (selectedCity) {
        try {
          const response = turkiye.data.filter(item => item.name === selectedCity)
          const res = response[0].districts.map(item => item.name)
          setDistricts(res)
        } catch (error) {
          console.error(error);
        }
      }
    }
    fetchDistricts();
  }, [selectedCity]);






  const checkoutSession = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`api/orderList`, {
        orderItems: items.map((item) => ({
          product: item.product._id,
          name: item.product.name,
          price: ((item.product.price) * (item.dolar)),
          image: item.product.image,
          quantity: item.quantity
        })),
        user: {
          ad: ad,
          soyad: soyad,
          email: email,
          tel: tel,
          tc: tc,
          vergiDaire: vergiDaire
        },
        shippingAddress: {
          address: address,
          city: selectedCity,
          district: selectedDistrict
        },
        shippingPrice: shippingPrice,
        totalPrice: total,
        paymentMethod: "PayTr",
        isPaid: isPaid,
        paidAt: Date()
      });
      console.log(response.data);
    } catch (error) {
      console.log(error)
    }
  }

  function handleCityChange(event) {
    setSelectedCity(event.target.value);
    setSelectedDistrict('');
  }

  function handleDistrictChange(event) {
    setSelectedDistrict(event.target.value);
  }

  function handleChecked(e) {
    if (checked === false) {
      setChecked(true)
    } else {
      setChecked(false)
    }

  }

  function handleCheckedTeslimat(e) {
    if (checkedTeslimat === false) {
      setCheckedTeslimat(true)
    } else {
      setCheckedTeslimat(false)
    }

  }
  const randomNumber = () => Math.trunc(Math.random() * 10);
  const input = `EZN60XXXXXXX${tc + Date()}`
  const generateOrderId = ((item) => item.replace(/X/g, randomNumber));
 

  async function getPaytrIframe() {
    try {
      const user_ip = ip;
      const merchant_id = "342098";
      const merchant_key = "eCKt71YGSWR6gKSk";
      const payment_amount = parseInt((total * 100).toFixed(0));
      const merchant_oid = generateOrderId(input);
      const no_installment = 0;
      const max_installment = 1;
      const currency = "TL";
      const test_mode = 1;
      const merchant_salt = "Y9ByEeMMP1eUy12r";
      let bask = [];
      items.map((item) => {
        bask.push([`${item.product.name}`, `${(item.product.price) * (item.dolar)}`, parseInt(`${item.quantity}`, 0)]);
      })
      const basket = JSON.stringify(bask);
      const user_basket = nodeBase64.encode(basket);
      const hashSTR = `${merchant_id}${user_ip}${merchant_oid}${email}${payment_amount}${user_basket}${no_installment}${max_installment}${currency}${test_mode}`;
      const paytr_token = hashSTR + merchant_salt;
      const token = crypto.createHmac("sha256", merchant_key).update(paytr_token).digest("base64");
      const params = {
        merchant_id: merchant_id,
        merchant_key: merchant_key,
        merchant_salt: merchant_salt,
        email: email,
        payment_amount: payment_amount,
        merchant_oid: merchant_oid,
        user_ip: user_ip,
        user_phone: tel,
        user_name:ad,
        user_address:address,
        merchant_ok_url: "https://eznsolar.com/success",
        merchant_fail_url: "https://eznsolar.com/fail",
        user_basket: user_basket,
        timeout_limit: 10,
        debug_on: 1,
        test_mode: 1,
        lang: "tr",
        no_installment: 0,
        max_installment: 1,
        currency: currency,
        paytr_token: token
      }
      const data = Object.keys(params)
        .map((key) => `${key}=${encodeURIComponent(params[key])}`)
        .join("&")
      const response = await axios.post("https://www.paytr.com/odeme/api/get-token", data, {
        headers:
          { 'content-type': 'application/x-www-form-urlencoded' },
      })
      
      setTokenPay(response.data.token);
    } catch (error) {
      console.log(error)
      return { retcode: -10 }
    }
  }

  const handlePaymentClick = () => {
    getPaytrIframe();
  };

console.log("deneme",tokenPay);
  // async function verifyPay(req, res) {
  //   var callback = req.body;
  //   console.log("body", req.body);
  //   const merchant_salt = "Y9ByEeMMP1eUy12r";
  //   const merchant_key = "eCKt71YGSWR6gKSk";
  //   const merchant_oid = generateOrderId(input);
  //   const paytr_token = callback.merchant_oid + merchant_salt + callback.status + callback.total_amount;
  //   var token = crypto.createHmac("sha256", merchant_key).update(paytr_token).digest("base64");
  //   if (token != callback.hash) {
  //     throw new Error("PAYTR notification failed: bad hash");
  //   }

  //   if (callback.status === 'success') {
  //     router.push("/success");
  //     // const data = await client.get(callback.merchant_oid)
  //     // const parseD = JSON.parse(data);
  //     // console.log(parseD)
  //     // try {
  //     //   if (parseD) {
  //     //     const data = await this.create(parseD.ip, callback.merchant_oid, parseD.user, parseD.order);
  //     //   }
  //     //   client.remove(callback.merchant_oid)
  //     // } catch (err) {

  //     // }

  //   } else {
  //     router.push("/fail");
  //     //basarisiz
  //   }

  //   res.send('OK');
  // }

  return (
    <Layout>
      {/* <div>
        <Script
          id="paytr-js"
          src="https://www.paytr.com/js/iframeResizer.min.js" />
      </div> */}

      <div className="boxed_wrapper">

        {/*Start breadcrumb area*/}
        <section
          className="breadcrumb-area"
        // style={{ backgroundImage: "url(images/resources/breadcrumb-bg.jpg)" }}
        >
          <div className="container">
            <div className="row">
              <div className="col-xl-12">
                <div className="inner-content clearfix">
                  <div className="title float-left">
                    <h1>Ödeme</h1>
                  </div>
                  <div className="breadcrumb-menu float-right">
                    <ul className="clearfix">
                      <li>
                        <Link href="/">Anasayfa</Link>
                      </li>
                      <li className="active">Ödeme</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/*End breadcrumb area*/}

        {/*Start Checkout area*/}
        <section className="checkout-area">
          <div className="bottom">
            <div className="container">
              <div className="row">
                <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12">
                  <div className="table">
                    <div className="shop-title-box">
                      <h3>Sipariş özeti</h3>
                    </div>
                    <table className="cart-table">
                      <thead className="cart-header">
                        <tr>
                          <th className="product-column">Ürünler</th>
                          <th>&nbsp;</th>
                          <th>Miktar</th>
                          <th className="price">Toplam</th>
                        </tr>
                      </thead>

                      {items.map((item, i) => (
                        <OdemeDetails
                          key={i}
                          _id={item.product._id}
                          name={item.product.name}
                          price={item.product.price}
                          description={item.product.description}
                          countInStock={item.product.countInStock}
                          image={item.product.image}
                          category={item.product.category}
                          subCategory={item.product.subCategory}
                          quantity={item.quantity}
                          dolar={item.dolar}
                          detail={item.product.detail}
                        />
                      ))}
                    </table>
                    {items.length === 0 && <h3 style={{ padding: "20px" }}>Sepetinizde ürün bulunmamaktadır</h3>}
                  </div>
                  <div className="cart-total">
                    <div className="shop-title-box">
                      <h3>Sepet</h3>
                    </div>
                    <ul className="cart-total-table">
                      <li className="clearfix">
                        <span className="col col-title">Sepet Ara Toplam</span>
                        <span className="col">{total.toFixed(2)} ₺</span>
                      </li>
                      <li className="clearfix">
                        <span className="col col-title">Kargo</span>
                        <span className="col">{total.toFixed(2) > 1000 ? 0 : 100} ₺</span>
                      </li>
                      <li className="clearfix">
                        <span className="col col-title">Toplam</span>
                        <span className="col">{total.toFixed(2) > 1000 ? (total.toFixed(2)) : (Number(total.toFixed(2)) + 100)} ₺</span>
                      </li>
                    </ul>

                  </div>
                </div>
                <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12">
                  <div className="form billing-info">
                    <div className="shop-title-box">
                      <h3>Fatura Adresi</h3>
                    </div>
                    <form>
                      <div className="row">

                        <div className="col-md-6">
                          <div className="field-label">Ad*</div>
                          <div className="field-input">
                            <input type="text" name="ad" required placeholder="" value={ad} onChange={(event) => setAd(event.target.value)} />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="field-label">Soyad*</div>
                          <div className="field-input">
                            <input type="text" name="soyad" required placeholder="" value={soyad} onChange={(event) => setSoyad(event.target.value)} />
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="field-label">TC Kimlik No veya Vergi No*</div>
                          <div className="field-input">
                            <input type="text" name="tcNo" required placeholder="" value={tc} onChange={(event) => setTc(event.target.value)} />
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="field-label">Vergi Dairesi</div>
                          <div className="field-input">
                            <input type="text" name="vergiDairesi" placeholder="" value={vergiDaire} onChange={(event) => setVergiDaire(event.target.value)} />
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="field-label">Adres*</div>
                          <div className="field-input">
                            <input type="text" required name="address" placeholder="" value={address} onChange={(event) => setAddress(event.target.value)} />
                          </div>
                        </div>

                        <div className="col-md-6">
                          <div className="field-label">İl*</div>
                          <div className="field-input">
                            <select id="city" value={selectedCity} onChange={handleCityChange}>
                              <option value="">Seçiniz</option>
                              {cities.map((city, i) => (
                                <option key={i} value={city}>{city}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="field-label">İlçe*</div>
                          <div className="field-input">
                            {/* <input type="text" name="selectedCity" placeholder="" value={selectedCity} onChange={(event) => setSelectedCity(event.target.value)} /> */}
                            <select id="district" value={selectedDistrict} onChange={handleDistrictChange}>
                              <option value="">Seçiniz</option>
                              {districts.map((city, i) => (
                                <option key={i} value={city}>{city}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="field-label">İletişim*</div>
                          <div className="field-input">
                            <input
                              required
                              type="text"
                              name="email"
                              placeholder="Email Adresi"
                              value={email} onChange={(event) => setEmail(event.target.value)}
                            />
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="field-input">
                            <input
                              required
                              type="text"
                              name="tel"
                              placeholder="Telefon Numarası"
                              value={tel} onChange={(event) => setTel(event.target.value)}
                            />
                          </div>
                        </div>
                        <div className="form shipping-info">
                          <div className="shop-title-box">
                            <h3>
                              Teslimat Adresi Farklı Olsun
                              <input type="checkbox" onChange={handleCheckedTeslimat} />
                            </h3>
                          </div>
                          {checkedTeslimat ?
                            <form method="post" action="checkout.html">
                              <div className="row">

                                <div className="col-md-6">
                                  <div className="field-label">Ad*</div>
                                  <div className="field-input">
                                    <input type="text" name="fname" placeholder="" />
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="field-label">Soyad*</div>
                                  <div className="field-input">
                                    <input type="text" name="lname" placeholder="" />
                                  </div>
                                </div>
                                <div className="col-md-12">
                                  <div className="field-label">Adres*</div>
                                  <div className="field-input">
                                    <input type="text" name="address" placeholder="" />
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="field-label">İl*</div>
                                  <div className="field-input">
                                    <select id="city" value={selectedCity} onChange={handleCityChange}>
                                      <option value="">Seçiniz</option>
                                      {cities.map((city, i) => (
                                        <option key={i} value={city}>{city}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="field-label">İlçe*</div>
                                  <div className="field-input">
                                    {/* <input type="text" name="selectedCity" placeholder="" value={selectedCity} onChange={(event) => setSelectedCity(event.target.value)} /> */}
                                    <select id="district" value={selectedDistrict} onChange={handleDistrictChange}>
                                      <option value="">Seçiniz</option>
                                      {districts.map((city, i) => (
                                        <option key={i} value={city}>{city}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              </div>
                            </form> : ""
                          }
                        </div>

                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="container">


            <div className="text-center">

              <div className="col-md-12">
                <div className="create-acc">
                  <div className="checkbox">
                    <label>
                      <input type="checkbox" name="ship-address" onChange={handleChecked} />
                      <span> <Link href={"/kvkk"}>Mesafeli Satış Sözleşmesini</Link> okudum, kabul ediyorum.</span>
                    </label>
                  </div>
                </div>
              </div>
              {
                (!ad || !soyad || !tc || !address || !city || !districts || !email || !tel || !checked) ?
                  <div><p style={{ color: "red" }}>Lütfen bütün alanları doldurunuz ve Sözleşmeyi işaretleyiniz</p>
                    <button className="btn-three" disabled={true}>
                      ÖDEME YAP
                      <span className="icon-null" />
                    </button></div> :

                  <button className="btn-three" onClick={handlePaymentClick} >
                    ÖDEME YAP
                    <span className="icon-null" />
                    
                  </button>
                  
              }
            </div>
            {tokenPay && (
        <IframeResizer
          src={`https://www.paytr.com/odeme/guvenli/${tokenPay}`}
          width="100%"
          scrolling="omit"
        />
      )}

          </div>
        </section>
        {/*End Checkout area*/}

      </div>
      {/* <div>
        <iframe src="https://www.paytr.com/odeme/guvenli/iframe_token" id="paytriframe"  frameborder="0"
        scrolling="no" style="width: 100%;"></iframe>
     </div>
      <div style={{ margin: '20px 0' }}>
        <p>deneme</p>
          <IframeResizer
            log
            inPageLinks
            forwardRef={ref}
            onResized={onResized}
            src={`https://www.paytr.com/odeme/guvenli/${tokenPay}`}
            width="100%"
            scrolling="omit"
          />
        </div> */}
    </Layout>
  )
}

export default Odeme

export async function getServerSideProps(context) {
  let ip;

  const { req } = context;

  if (req.headers['x-forwarded-for']) {
    ip = req.headers['x-forwarded-for'].split(',')[0];
  } else if (req.headers['x-real-ip']) {
    ip = req.connection.remoteAddress;
  } else {
    ip = req.connection.remoteAddress;
  }
  return {
    props: {
      ip,
    },
  };
}